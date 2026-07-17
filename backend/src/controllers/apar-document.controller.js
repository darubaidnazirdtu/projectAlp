import path from 'node:path';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { deleteObject, getObject, isAparObjectPath } from '../services/minio.service.js';
import { discardTemporaryDocument, getTemporaryDocument, recordPendingTemporaryDocument } from '../services/apar-temp-document.service.js';
import { AparForm } from '../models/aparForm.model.js';
import { resolveToReadableId } from '../utils/apar-helpers.js';

const clearDocumentReference = (value, documentPath) => {
    if (Array.isArray(value)) return value.map(item => clearDocumentReference(item, documentPath));
    if (!value || typeof value !== 'object') return value;
    // Keep Date/ObjectId and other non-plain values intact while walking the
    // APAR research object; only regular nested objects contain field values.
    if (value.constructor !== Object) return value;

    const result = {};
    for (const [key, child] of Object.entries(value)) {
        result[key] = child === documentPath ? '' : clearDocumentReference(child, documentPath);
    }
    return result;
};

const containsDocumentPath = (value, documentPath) => {
    if (value === documentPath) return true;
    if (Array.isArray(value)) return value.some(item => containsDocumentPath(item, documentPath));
    if (value && typeof value === 'object') return Object.values(value).some(item => containsDocumentPath(item, documentPath));
    return false;
};

export const uploadTemporaryDocument = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.filename) throw new ApiError(400, 'A PDF file is required');
    
    const facultyId = await resolveToReadableId(req.user?.userId || req.user?.faculty_id || req.user?.id);
    console.log(`[UPLOAD TEMP] Resolving user ${req.user?.id} to facultyId: ${facultyId} for tempId: ${file.filename}`);
    recordPendingTemporaryDocument(file.filename, facultyId);

    return res.status(201).json(new ApiResponse(201, {
        tempId: file.filename,
        originalName: path.basename(file.originalname),
        mimeType: file.mimetype,
        size: file.size
    }, 'PDF saved temporarily. It will be uploaded when the entry is saved.'));
});

import fs from 'node:fs';
import { uploadLocalFile } from '../services/minio.service.js';

export const uploadDirectMinioDocument = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.filename) throw new ApiError(400, 'A PDF file is required');
    
    const facultyId = await resolveToReadableId(req.user?.userId || req.user?.faculty_id || req.user?.id);
    let academicYear = req.body.ay || req.body.academic_year || req.query.ay || req.user?.academicYear || 'unknown_ay';
    
    const safeAy = String(academicYear).replace(/[^a-zA-Z0-9-]/g, '_');
    const safeFac = String(facultyId).replace(/[^a-zA-Z0-9-]/g, '_');
    const basename = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = `${basename}-${Date.now()}${path.extname(file.originalname)}`;
    
    let folder = req.body.folder || `optionaldocuments/${safeAy}`;
    // Strip trailing slashes to avoid double slashes
    folder = folder.replace(/\/+$/, '');
    
    const minioPath = `${folder}/${safeFac}/${safeName}`;
    
    await uploadLocalFile({ 
        filePath: file.path, 
        objectPath: minioPath, 
        contentType: file.mimetype 
    });
    
    try {
        fs.unlinkSync(file.path);
    } catch (e) {}

    return res.status(201).json(new ApiResponse(201, {
        url: minioPath,
        originalName: path.basename(file.originalname)
    }, 'File uploaded directly to MinIO successfully.'));
});

export const deleteTemporaryDocument = asyncHandler(async (req, res) => {
    const tempId = String(req.query.tempId || '');
    const facultyId = await resolveToReadableId(req.user?.userId || req.user?.faculty_id || req.user?.id);
    
    if (!getTemporaryDocument(tempId, facultyId)) {
        throw new ApiError(404, 'Temporary PDF was not found');
    }
    await discardTemporaryDocument(tempId);
    return res.status(204).end();
});

// Removes a saved APAR PDF and clears its database reference together. This is
// deliberately separate from temporary-upload cleanup so a click on the trash
// icon cannot leave an orphan file behind while the user is editing a row.
export const deleteSavedDocument = asyncHandler(async (req, res) => {
    const documentPath = String(req.query.path || '');
    if (!isAparObjectPath(documentPath)) throw new ApiError(400, 'Invalid document path');

    const facultyId = await resolveToReadableId(req.user?.userId || req.user?.faculty_id || req.user?.id);
    const forms = await AparForm.find({ faculty_id: facultyId });
    const form = forms.find(candidate => {
        const plainCandidate = candidate.toObject?.() || candidate;
        return containsDocumentPath(plainCandidate.research, documentPath) || 
               containsDocumentPath(plainCandidate.teaching, documentPath);
    });
    if (!form) throw new ApiError(404, 'PDF was not found in your APAR form');

    const plainForm = form.toObject?.() || form;
    if (containsDocumentPath(plainForm.research, documentPath)) {
        form.research = clearDocumentReference(plainForm.research, documentPath);
    }
    if (containsDocumentPath(plainForm.teaching, documentPath)) {
        form.teaching = clearDocumentReference(plainForm.teaching, documentPath);
    }
    await form.save();
    await deleteObject(documentPath);

    return res.status(204).end();
});

export const streamDocument = asyncHandler(async (req, res) => {
    const objectPath = String(req.query.path || '');
    if (!isAparObjectPath(objectPath)) throw new ApiError(400, 'Invalid document path');

    const stream = await getObject(objectPath);
    const extension = path.extname(objectPath).toLowerCase();
    const contentTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
    };
    res.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(objectPath)}"`);
    stream.on('error', (error) => res.destroy(error));
    stream.pipe(res);
});
