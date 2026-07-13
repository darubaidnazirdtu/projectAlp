import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const unlink = promisify(fs.unlink);
export const TEMP_DOCUMENT_DIR = path.join(process.cwd(), 'storage', 'temp', 'apar-documents');

export const ensureTempDocumentDirectory = () => fs.mkdirSync(TEMP_DOCUMENT_DIR, { recursive: true });

const safeTempId = (tempId) => /^[0-9a-f-]{36}\.pdf$/i.test(String(tempId || ''));
const metadataPath = (tempId) => path.join(TEMP_DOCUMENT_DIR, `${tempId}.json`);
export const tempDocumentPath = (tempId) => path.join(TEMP_DOCUMENT_DIR, String(tempId));

export const createTempDocumentId = () => `${crypto.randomUUID()}.pdf`;

export const getTemporaryDocument = (tempId, ownerId) => {
    if (!safeTempId(tempId)) return null;
    const filePath = tempDocumentPath(tempId);
    if (!fs.existsSync(filePath)) return null;
    try {
        const record = JSON.parse(fs.readFileSync(metadataPath(tempId), 'utf8'));
        if (String(record.ownerId) !== String(ownerId) || record.state !== 'pending') return null;
    } catch {
        return null;
    }
    return { filePath, tempId, ownerId };
};

export const recordPendingTemporaryDocument = (tempId, ownerId) => {
    if (!safeTempId(tempId)) return;
    fs.writeFileSync(metadataPath(tempId), JSON.stringify({ ownerId: String(ownerId), state: 'pending' }), { encoding: 'utf8', mode: 0o600 });
};

export const recordCompletedTemporaryDocument = (tempId, ownerId, objectPath) => {
    if (!safeTempId(tempId)) return;
    fs.writeFileSync(metadataPath(tempId), JSON.stringify({ ownerId: String(ownerId), state: 'complete', objectPath }), { encoding: 'utf8', mode: 0o600 });
};

export const getCompletedTemporaryDocument = (tempId, ownerId) => {
    if (!safeTempId(tempId) || !fs.existsSync(metadataPath(tempId))) return null;
    try {
        const record = JSON.parse(fs.readFileSync(metadataPath(tempId), 'utf8'));
        return String(record.ownerId) === String(ownerId) ? record.objectPath : null;
    } catch {
        return null;
    }
};

export const removeTemporaryDocument = async (tempId) => {
    if (!safeTempId(tempId)) return;
    const filePath = tempDocumentPath(tempId);
    if (fs.existsSync(filePath)) {
        try { await unlink(filePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
};

export const discardTemporaryDocument = async (tempId) => {
    await removeTemporaryDocument(tempId);
    if (safeTempId(tempId) && fs.existsSync(metadataPath(tempId))) {
        try { await unlink(metadataPath(tempId)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
};
