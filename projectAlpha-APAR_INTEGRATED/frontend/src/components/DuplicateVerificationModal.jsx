import React, { useState } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

/**
 * Modal for verifying duplicate entries
 * Shows side-by-side comparison of new vs existing entry
 * Allows faculty to choose: Keep Existing, Replace, or Create New
 */
export const DuplicateVerificationModal = ({
    isOpen,
    onClose,
    newEntry,
    existingEntry,
    matchedFields = [],
    confidence = 1.0,
    entityType = 'entry',
    onKeepExisting,
    onReplaceWithNew,
    onCreateNew
}) => {
    if (!isOpen || !newEntry || !existingEntry) return null;

    const [selectedAction, setSelectedAction] = useState(null);

    // Get all unique keys from both entries
    const allKeys = [
        ...new Set([...Object.keys(newEntry), ...Object.keys(existingEntry)])
    ].filter(key =>
        !key.startsWith('_') &&
        !key.startsWith('metadata') &&
        key !== '__v' &&
        key !== 'createdAt' &&
        key !== 'updatedAt'
    );

    const renderField = (key, newVal, existingVal, isMatched) => {
        // Skip if both are empty
        if (!newVal && !existingVal) return null;

        return (
            <div
                key={key}
                className={`p-3 rounded-lg border transition-all ${isMatched
                        ? 'bg-yellow-50 border-yellow-300 shadow-sm'
                        : 'bg-gray-50 border-gray-200'
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                    </div>
                    {isMatched && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiCheck className="w-3 h-3" />
                            Match
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Your Entry</div>
                        <div className={`text-sm ${newVal ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                            {newVal || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-indigo-600 mb-1">Existing Entry</div>
                        <div className={`text-sm ${existingVal ? 'text-indigo-700 font-medium' : 'text-gray-400 italic'}`}>
                            {existingVal || '—'}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleAction = (action) => {
        setSelectedAction(action);
        setTimeout(() => {
            if (action === 'keep') onKeepExisting();
            else if (action === 'replace') onReplaceWithNew();
            else if (action === 'new') onCreateNew();
        }, 200);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">Possible Duplicate Detected</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                We found an existing {entityType} that matches <strong>{Math.round(confidence * 100)}%</strong> of your data.
                                Please review and choose how to proceed.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Matched fields:</strong> {matchedFields.join(', ')}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {allKeys.map(key =>
                            renderField(
                                key,
                                newEntry[key],
                                existingEntry[key],
                                matchedFields.includes(key)
                            )
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAction('keep')}
                                disabled={selectedAction !== null}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${selectedAction === 'keep'
                                        ? 'bg-indigo-700 text-white scale-95'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <FiCheck className="w-4 h-4" />
                                Keep Existing
                            </button>

                            <button
                                onClick={() => handleAction('replace')}
                                disabled={selectedAction !== null}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${selectedAction === 'replace'
                                        ? 'bg-orange-700 text-white scale-95'
                                        : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Replace with New
                            </button>

                            <button
                                onClick={() => handleAction('new')}
                                disabled={selectedAction !== null}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${selectedAction === 'new'
                                        ? 'bg-gray-700 text-white scale-95'
                                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Create as New Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuplicateVerificationModal;
