import { Client } from 'minio';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

const configuredEndpoint = process.env.MINIO_ENDPOINT || 'minio';
const endpoint = configuredEndpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
const bucket = process.env.MINIO_BUCKET || 'apar-storage';

const client = new Client({
    endPoint: endpoint,
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: String(process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
    accessKey: process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || 'minioadmin'
});

let bucketReady;

export const getAparBucket = () => bucket;

export const ensureAparBucket = async () => {
    if (!bucketReady) {
        bucketReady = (async () => {
            const exists = await client.bucketExists(bucket);
            if (!exists) await client.makeBucket(bucket);
        })().catch((error) => {
            bucketReady = undefined;
            throw error;
        });
    }
    return bucketReady;
};

const safeSegment = (value, fallback) => {
    const cleaned = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return cleaned || fallback;
};

export const createProfilePicturePath = (facultyName, originalName) => {
    const extension = path.extname(originalName || '').toLowerCase();
    return `profilepicture/${safeSegment(facultyName, 'faculty')}/${uuidv4()}${extension}`;
};

export const createDocumentPath = (facultyName, academicYear) => (
    `document/${safeSegment(facultyName, 'faculty')}/${safeSegment(academicYear, 'academic_year')}/${uuidv4()}.pdf`
);

export const uploadLocalFile = async ({ filePath, objectPath, contentType }) => {
    await ensureAparBucket();
    const fileStat = await stat(filePath);
    await client.putObject(bucket, objectPath, createReadStream(filePath), fileStat.size, {
        'Content-Type': contentType || 'application/octet-stream'
    });
    return objectPath;
};

export const deleteObject = async (objectPath) => {
    if (!objectPath) return;
    await ensureAparBucket();
    await client.removeObject(bucket, objectPath);
};

export const getObject = async (objectPath) => {
    await ensureAparBucket();
    return client.getObject(bucket, objectPath);
};

export const isAparObjectPath = (value) => (
    typeof value === 'string' && /^(profilepicture|document)\//.test(value)
);
