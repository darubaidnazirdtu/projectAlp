import React, { useState, useRef } from 'react';
import { Api } from '../api/Api';
import { FiUpload, FiEye, FiTrash2, FiLoader } from 'react-icons/fi';
import { toast } from 'sonner';

const FileUpload = ({ value, onChange, disabled, required = false, temporaryPdf = false, directMinio = false, deferUpload = false, academicYear = '' }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const api = new Api(); // Use default base URL

    const deleteSavedPdf = async (path) => {
        await api.delete(`/apar/mongo/documents?path=${encodeURIComponent(path)}`);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if ((temporaryPdf || directMinio) && (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf'))) {
            toast.error('Only PDF files are allowed');
            e.target.value = '';
            return;
        }
        if ((temporaryPdf || directMinio) && file.size > 50 * 1024 * 1024) {
            toast.error('PDF must be 50 MB or smaller');
            e.target.value = '';
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (directMinio && academicYear) {
            formData.append('ay', academicYear);
        }

        try {
            // A persisted PDF is removed before its replacement is uploaded. The
            // API clears the APAR reference and deletes the object as one action.
            if ((temporaryPdf || directMinio) && typeof value === 'string' && /^(document|additional documents|profile|optionaldocuments)\//.test(value)) {
                await deleteSavedPdf(value);
                onChange('');
            }

            if (deferUpload) {
                onChange(file);
                setUploading(false);
                return;
            }

            let endpoint = '/upload';
            if (temporaryPdf) {
                endpoint = '/apar/mongo/documents/temp';
            } else if (directMinio) {
                endpoint = '/apar/mongo/documents/direct';
            }

            // Use Api.post and let axios set the multipart boundary header
            const result = await api.post(endpoint, formData, { 'Content-Type': undefined });

            // Api.post unwraps the response to `data` so `result` should be the controller's `data`
            if (temporaryPdf && result?.tempId) {
                // Keep an already-saved document available until the parent entry
                // saves the replacement. Only a previous *temporary* selection can
                // be discarded here.
                const previousTempId = value?.tempId;
                onChange(result);
                if (previousTempId && previousTempId !== result.tempId) {
                    try {
                        await api.delete(`/apar/mongo/documents/temp?tempId=${encodeURIComponent(previousTempId)}`);
                    } catch (cleanupError) {
                        // A save may already have consumed and removed this temp
                        // file. A 404 is therefore an expected no-op.
                        if (cleanupError?.response?.status !== 404) {
                            console.warn('Previous temporary PDF cleanup failed:', cleanupError);
                        }
                    }
                }
                toast.success('PDF attached. It will upload when you save the entry.');
            } else if (result && result.url) {
                onChange(result.url);
                toast.success('File uploaded successfully');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('File upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current && !deferUpload) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = async () => {
        if (value instanceof File) {
            onChange('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (temporaryPdf && value?.tempId) {
            try {
                await api.delete(`/apar/mongo/documents/temp?tempId=${encodeURIComponent(value.tempId)}`);
            } catch (error) {
                if (error?.response?.status !== 404) {
                    console.warn('Temporary PDF cleanup failed:', error);
                }
            }
        } else if ((temporaryPdf || directMinio) && typeof value === 'string' && /^(document|additional documents|profile|optionaldocuments)\//.test(value)) {
            try {
                await deleteSavedPdf(value);
            } catch (error) {
                console.error('Saved PDF deletion failed:', error);
                toast.error('Could not delete the PDF');
                return;
            }
        }
        onChange('');
        if (temporaryPdf || directMinio) toast.success('PDF deleted');
    };

    const isFileObject = value instanceof File;
    const isTemporary = Boolean(!isFileObject && value && typeof value === 'object' && value.tempId);
    const displayName = isFileObject ? value.name : (isTemporary ? value.originalName || 'Selected PDF' : null);
    const viewUrl = typeof value === 'string' && /^(document|profile|profilepicture|additional documents|optionaldocuments)\//.test(value)
        ? `${api.client.defaults.baseURL}/apar/mongo/document?path=${encodeURIComponent(value)}`
        : value;

    return (
        <div className="flex items-center space-x-2">
            {/* Hidden text input mirrors selected/uploaded value to participate in native form validation */}
            {required && (
                <input
                    aria-hidden
                    tabIndex={-1}
                    value={value || ''}
                    required
                    readOnly
                    onChange={() => {}}
                    style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                />
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={temporaryPdf ? 'application/pdf,.pdf' : undefined}
                disabled={disabled || uploading}
            />

            {!value && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm transition-colors"
                >
                    {uploading ? <FiLoader className="animate-spin mr-2" /> : <FiUpload className="mr-2" />}
                    {uploading ? 'Uploading...' : 'Click here to upload'}
                </button>
            )}

            {value && (
                <div className="flex items-center space-x-2">
                    {(isTemporary || isFileObject) ? (
                        <span className="flex items-center px-3 py-2 bg-amber-100 text-amber-800 rounded text-sm">{displayName} (pending save)</span>
                    ) : (
                        <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                        >
                            <FiEye className="mr-2" />
                            Click here to view
                        </a>
                    )}

                    {!disabled && (
                        <>
                            {temporaryPdf && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm transition-colors"
                                >
                                    {uploading ? <FiLoader className="animate-spin mr-2" /> : <FiUpload className="mr-2" />}
                                    {uploading ? 'Uploading...' : 'Replace PDF'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                title="Remove file"
                            >
                                <FiTrash2 />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
