import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiClock, FiUser, FiActivity } from 'react-icons/fi';

const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AuditLogModal = ({ metadata, onClose }) => {
    // Determine positioning or just center it without the backdrop overlay visual
    // functionality-wise, we still want to close on click outside, but no visual backdrop.
    
    if (!metadata) return null;

    const changeLog = metadata.change_log || [];
    const sortedLogs = [...changeLog].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    useEffect(() => {
        document.body.classList.add('audit-modal-open');
        return () => {
            document.body.classList.remove('audit-modal-open');
        };
    }, []);

    return createPortal(
        <>
            {/* Invisible backdrop for click-outside to close */}
            <div 
                className="fixed inset-0 z-50 bg-transparent"
                onClick={onClose} 
            />
            
            {/* Modal - Centered but floating */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div 
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col pointer-events-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-indigo-600" />
                                Activity History
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wide">
                                Total {sortedLogs.length} Events
                            </p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all active:scale-95"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content - Timeline */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {sortedLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                    <FiClock size={24} className="text-gray-300" />
                                </div>
                                <p className="text-sm">No activity recorded yet</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100" />

                                <div className="space-y-6">
                                    {sortedLogs.map((log, idx) => {
                                        const isCreated = log.action === 'created';
                                        return (
                                            <div key={idx} className="relative flex gap-4">
                                                {/* Timeline Node */}
                                                <div className={`
                                                    relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-[3px] shadow-sm ml-[-1px] mt-0.5 flex-shrink-0
                                                    ${isCreated ? 'bg-indigo-50 border-white ring-1 ring-indigo-100' : 'bg-white border-white ring-1 ring-gray-200'}
                                                `}>
                                                    <div className={`w-2 h-2 rounded-full ${isCreated ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                                                </div>

                                                {/* Content Card */}
                                                <div className="flex-1 pt-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {isCreated ? 'Record Created' : 'Record Updated'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                                                <FiUser size={12} />
                                                                <span className="font-medium text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                    {log.user_id || 'System'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                                                            {formatDateTime(log.timestamp)}
                                                        </span>
                                                    </div>

                                                    {log.changes && (
                                                        <div className="mt-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100 text-xs text-gray-600 leading-relaxed font-mono">
                                                            {log.changes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

// Button component to trigger the modal
export const AuditLogButton = ({ metadata }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const logCount = metadata?.change_log?.length || 0;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200"
            >
                <FiClock size={12} />
                <span>View ({logCount})</span>
            </button>
            
            {isOpen && (
                <AuditLogModal 
                    metadata={metadata} 
                    onClose={() => setIsOpen(false)} 
                />
            )}
        </>
    );
};

export default AuditLogModal;
