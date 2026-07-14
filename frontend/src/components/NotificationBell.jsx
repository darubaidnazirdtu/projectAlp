import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiExternalLink, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification, clearNotifications, loading, refresh } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedNotifications, setExpandedNotifications] = useState(new Set());
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'APAR_SUBMISSION': return <FiInfo className="text-blue-500" />;
            case 'APAR_REVIEW_REQUEST': return <FiCheckCircle className="text-green-500" />;
            case 'APAR_COMPLETED': return <FiCheckCircle className="text-purple-500" />;
            case 'IQAC_UPDATE': return <FiExternalLink className="text-orange-500" />;
            case 'IQAC_APPROVAL_REQUEST': return <FiCheckCircle className="text-emerald-500" />;
            case 'IQAC_APPROVAL_DECISION': return <FiInfo className="text-indigo-500" />;
            case 'SYSTEM_ALERT': return <FiAlertCircle className="text-red-500" />;
            default: return <FiBell className="text-gray-500" />;
        }
    };

    const getTypeBadgeColor = (entryType) => {
        const colors = {
            journal: 'bg-blue-100 text-blue-700',
            conference: 'bg-purple-100 text-purple-700',
            book: 'bg-green-100 text-green-700',
            funding: 'bg-yellow-100 text-yellow-700',
            project: 'bg-yellow-100 text-yellow-700',
            consultancy: 'bg-indigo-100 text-indigo-700',
            patent: 'bg-pink-100 text-pink-700',
            award: 'bg-red-100 text-red-700',
            fdp: 'bg-teal-100 text-teal-700',
            workshop: 'bg-teal-100 text-teal-700'
        };
        return colors[entryType] || 'bg-gray-100 text-gray-700';
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return null;
        return `₹${Number(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const toggleExpanded = (notificationId, e) => {
        e.stopPropagation();
        setExpandedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(notificationId)) {
                newSet.delete(notificationId);
            } else {
                newSet.add(notificationId);
            }
            return newSet;
        });
    };

    const renderDetailField = (label, value) => {
        if (!value || value === 'N/A' || value === 0) return null;
        return (
            <div className="flex justify-between text-xs py-1">
                <span className="text-gray-500 font-medium">{label}:</span>
                <span className="text-gray-700 font-semibold text-right ml-2">{value}</span>
            </div>
        );
    };

    const renderEntryDetails = (metadata) => {
        if (!metadata || !metadata.details) return null;

        const { details, entryType } = metadata;

        switch (entryType) {
            case 'journal':
                return (
                    <>
                        {renderDetailField('Title', details.title)}
                        {renderDetailField('Journal', details.journal)}
                        {renderDetailField('Year', details.year)}
                        {renderDetailField('DOI', details.doi)}
                        {renderDetailField('Authors', details.authors > 0 ? `${details.authors} faculty` : null)}
                        {renderDetailField('Students', details.students > 0 ? `${details.students} students` : null)}
                    </>
                );

            case 'conference':
                return (
                    <>
                        {renderDetailField('Title', details.title)}
                        {renderDetailField('Conference', details.conference)}
                        {renderDetailField('Year', details.year)}
                        {renderDetailField('Venue', details.venue)}
                        {renderDetailField('Level', details.level)}
                        {renderDetailField('Authors', details.authors > 0 ? `${details.authors} faculty` : null)}
                    </>
                );

            case 'book':
                return (
                    <>
                        {renderDetailField('Book', details.bookTitle)}
                        {renderDetailField('Chapter', details.chapterTitle)}
                        {renderDetailField('Publisher', details.publisher)}
                        {renderDetailField('Year', details.year)}
                        {renderDetailField('Type', details.type)}
                    </>
                );

            case 'funding':
            case 'project':
                return (
                    <>
                        {renderDetailField('Title', details.title)}
                        {renderDetailField('Agency', details.agency)}
                        {renderDetailField('Amount', formatCurrency(details.amount))}
                        {renderDetailField('Start Date', formatDate(details.startDate))}
                        {renderDetailField('End Date', formatDate(details.endDate))}
                        {renderDetailField('Status', details.status)}
                        {renderDetailField('Faculty', details.faculty > 0 ? `${details.faculty} members` : null)}
                    </>
                );

            case 'consultancy':
                return (
                    <>
                        {renderDetailField('Project', details.title)}
                        {renderDetailField('Agency', details.agency)}
                        {renderDetailField('Revenue', formatCurrency(details.revenue))}
                        {renderDetailField('Start Date', formatDate(details.startDate))}
                        {renderDetailField('Type', details.type)}
                    </>
                );

            case 'patent':
                return (
                    <>
                        {renderDetailField('Title', details.title)}
                        {renderDetailField('Application No.', details.applicationNumber)}
                        {renderDetailField('Patent No.', details.patentNumber)}
                        {renderDetailField('Status', details.status)}
                        {renderDetailField('Filing Date', formatDate(details.filingDate))}
                        {renderDetailField('Inventors', details.inventors > 0 ? `${details.inventors} faculty` : null)}
                    </>
                );

            case 'award':
                return (
                    <>
                        {renderDetailField('Award', details.name)}
                        {renderDetailField('Agency', details.agency)}
                        {renderDetailField('Date', formatDate(details.date))}
                        {renderDetailField('Level', details.level)}
                        {renderDetailField('Category', details.category)}
                        {renderDetailField('Value', formatCurrency(details.monetaryValue))}
                    </>
                );

            case 'fdp':
            case 'workshop':
                return (
                    <>
                        {renderDetailField('Title', details.title)}
                        {renderDetailField('Organizer', details.organizer)}
                        {renderDetailField('Duration', details.duration ? `${details.duration} days` : null)}
                        {renderDetailField('Start Date', formatDate(details.startDate))}
                        {renderDetailField('Type', details.type)}
                        {renderDetailField('Mode', details.mode)}
                    </>
                );

            default:
                return renderDetailField('Title', details.title);
        }
    };

    const handleNotificationClick = (n) => {
        if (!n.isRead) {
            markAsRead(n._id);
        }
        // Don't close dropdown - let user read notifications
        // Only navigate if they explicitly click a link
        // if (n.link) {
        //     navigate(n.link);
        // }
    };

    const handleOpenLink = (notification, event) => {
        event.stopPropagation();
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.link) {
            setIsOpen(false);
            navigate(notification.link);
        }
    };

    const handleDeleteNotification = (notification, event) => {
        event.stopPropagation();
        deleteNotification(notification._id);
    };

    const handleClearAll = (event) => {
        event.stopPropagation();
        clearNotifications();
        setExpandedNotifications(new Set());
    };

    const handleToggle = () => {
        if (!isOpen) {
            // Refresh notifications when opening to ensure "all previous notifications" are shown
            refresh();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="p-2.5 rounded-full hover:bg-gray-100/80 transition-all relative backdrop-blur-sm shadow-sm border border-gray-200/50 bg-white/50"
                aria-label="Notifications"
            >
                <FiBell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/4 bg-gradient-to-br from-red-400 to-rose-600 rounded-full shadow-md shadow-red-200">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 z-50 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-5 py-4 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                        <h3 className="font-bold text-white text-lg relative z-10 flex items-center gap-2">
                            <FiBell className="w-5 h-5 text-indigo-100" /> Notifications
                        </h3>
                        <div className="flex items-center gap-3 relative z-10">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/20"
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs bg-white/10 hover:bg-red-500/80 text-white px-2 py-1.5 rounded-lg font-medium transition-colors backdrop-blur-sm"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
                        {loading && notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 animate-pulse">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-sm font-medium">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                <div className="p-4 bg-gray-50 rounded-full shadow-inner">
                                    <FiBell className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="font-medium text-gray-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => {
                                    const isExpanded = expandedNotifications.has(n._id);
                                    const hasDetails = n.metadata && n.metadata.details && Object.keys(n.metadata.details).length > 0;

                                    return (
                                        <div
                                            key={n._id}
                                            className={`p-5 hover:bg-indigo-50/40 transition-all border-l-4 group relative ${!n.isRead ? 'bg-indigo-50/20 border-indigo-500' : 'border-transparent'}`}
                                        >
                                            <div
                                                className="flex gap-4 cursor-pointer"
                                                onClick={() => handleNotificationClick(n)}
                                            >
                                                <div className="mt-1 flex-shrink-0 relative">
                                                    {getTypeIcon(n.type)}
                                                    {!n.isRead && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm font-bold text-gray-900 ${!n.isRead ? 'text-indigo-900' : ''}`}>
                                                            {n.title}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => handleDeleteNotification(n, event)}
                                                            className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            title="Delete notification"
                                                        >
                                                            <FiTrash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {n.metadata && n.metadata.displayType && (
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${getTypeBadgeColor(n.metadata.entryType)}`}>
                                                            {n.metadata.displayType}
                                                        </span>
                                                    )}

                                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium tracking-wider">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </p>

                                                </div>
                                            </div>

                                            {hasDetails && (
                                                <>
                                                    <button
                                                        onClick={(e) => toggleExpanded(n._id, e)}
                                                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2 ml-9"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <FiChevronUp className="w-3 h-3" />
                                                                Hide details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiChevronDown className="w-3 h-3" />
                                                                Show details
                                                            </>
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="mt-2 ml-9 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <div className="space-y-1">
                                                                {renderEntryDetails(n.metadata)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center backdrop-blur-md">
                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-bold tracking-wide transition-colors uppercase">
                            View all activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
