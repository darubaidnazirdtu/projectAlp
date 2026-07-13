import path from 'node:path';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { getObject, isAparObjectPath } from '../services/minio.service.js';
import { discardTemporaryDocument, recordPendingTemporaryDocument } from '../services/apar-temp-document.service.js';

export const uploadTemporaryDocument = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.filename) throw new ApiError(400, 'A PDF file is required');
    recordPendingTemporaryDocument(file.filename, req.user.id);

    return res.status(201).json(new ApiResponse(201, {
        tempId: file.filename,
        originalName: path.basename(file.originalname),
        mimeType: file.mimetype,
        size: file.size
    }, 'PDF saved temporarily. It will be uploaded when the entry is saved.'));
});

export const deleteTemporaryDocument = asyncHandler(async (req, res) => {
    const tempId = String(req.query.tempId || '');
    await discardTemporaryDocument(tempId);
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
