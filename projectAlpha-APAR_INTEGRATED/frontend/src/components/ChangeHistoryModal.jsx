import React, { useState } from 'react';
import { FiClock, FiX, FiUser, FiCalendar } from 'react-icons/fi';

const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(date);
};

export const ChangeHistoryModal = ({ isOpen, onClose, record, title }) => {
    if (!isOpen || !record) return null;

    const changeLogs = record.metadata?.change_log || [];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen p-4">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />

                {/* Modal */}
                <div
                    className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FiClock className="text-indigo-600" />
                                    Change History
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">{title || 'Record History'}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-140px)] bg-gray-50/50">
                        {changeLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <FiClock className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4 text-gray-500">No change history available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {changeLogs.map((entry, index) => {
                                    const isLatest = index === changeLogs.length - 1;
                                    const actionColor = {
                                        created: 'bg-green-100 text-green-800 border-green-200',
                                        updated: 'bg-blue-100 text-blue-800 border-blue-200',
                                        rollback: 'bg-orange-100 text-orange-800 border-orange-200'
                                    }[entry.action] || 'bg-gray-100 text-gray-800 border-gray-200';

                                    return (
                                        <div
                                            key={index}
                                            className={`relative p-4 rounded-lg border transition-all ${isLatest
                                                    ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-100'
                                                    : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {isLatest && (
                                                <div className="absolute -top-2 -right-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm">
                                                        Latest
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${actionColor}`}>
                                                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatRelativeTime(entry.timestamp)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <FiUser className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">User:</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                        {entry.user_id || 'System'}
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-2 text-gray-600">
                                                    <FiCalendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium">Time:</span>
                                                        <span className="ml-2 text-gray-800">{formatDateTime(entry.timestamp)}</span>
                                                    </div>
                                                </div>

                                                {entry.changes && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                            Changes
                                                        </p>
                                                        <div className="bg-gray-50 rounded px-3 py-2 text-xs font-mono text-gray-700 leading-relaxed">
                                                            {entry.changes}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                Total {changeLogs.length} {changeLogs.length === 1 ? 'change' : 'changes'}
                            </p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ChangeLogButton = ({ record, title }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const changeCount = record?.metadata?.change_log?.length || record?.change_count || 0;
    const lastModifiedAt = record?.last_modified_at || record?.metadata?.updated_at;

    // Determine badge color based on recency
    const isRecent = lastModifiedAt && (Date.now() - new Date(lastModifiedAt).getTime()) < 86400000; // 24h
    const badgeColor = isRecent ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300';

    if (changeCount === 0) {
        return <span className="text-xs text-gray-400">—</span>;
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all hover:shadow-sm ${badgeColor} hover:scale-105`}
                title="View change history"
            >
                <FiClock className="w-3.5 h-3.5" />
                <span>{changeCount}</span>
            </button>

            <ChangeHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={record}
                title={title}
            />
        </>
    );
};
