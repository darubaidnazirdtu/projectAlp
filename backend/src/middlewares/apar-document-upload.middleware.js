import multer from 'multer';
import path from 'node:path';
import { createTempDocumentId, ensureTempDocumentDirectory, TEMP_DOCUMENT_DIR } from '../services/apar-temp-document.service.js';

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        try {
            ensureTempDocumentDirectory();
            callback(null, TEMP_DOCUMENT_DIR);
        } catch (error) {
            callback(error);
        }
    },
    filename: (_req, _file, callback) => callback(null, createTempDocumentId())
});

export const uploadAparTemporaryDocument = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        const isPdf = path.extname(file.originalname || '').toLowerCase() === '.pdf'
            && file.mimetype === 'application/pdf';
        callback(isPdf ? null : new Error('Only PDF files are allowed'), isPdf);
    }
});
