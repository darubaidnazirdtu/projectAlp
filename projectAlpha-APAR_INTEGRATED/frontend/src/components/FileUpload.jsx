import React, { useState, useRef } from 'react';
import { Api } from '../api/Api';
import { FiUpload, FiEye, FiTrash2, FiLoader } from 'react-icons/fi';
import { toast } from 'sonner';

const FileUpload = ({ value, onChange, disabled }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const api = new Api(); // Use default base URL

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Using api.client directly to handle multipart/form-data correctly
            // and avoiding the default application/json header issue if any
            const response = await api.client.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // The backend returns { statusCode: 200, data: { url: ... }, message: ... }
            const data = response.data?.data;

            if (data?.url) {
                onChange(data.url);
                toast.success('File uploaded successfully');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('File upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
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
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                    >
                        <FiEye className="mr-2" />
                        Click here to view
                    </a>

                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Remove file"
                        >
                            <FiTrash2 />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
