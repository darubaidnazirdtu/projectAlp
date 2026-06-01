import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AparFormGradedService } from '../../services/apar_form_graded.services.js';
import { aparLogout, aparInitializeSession } from '../../store/slices/aparAuthSlice.js';
import { FiAlertCircle, FiClock, FiFileText, FiArchive, FiPlus, FiCamera, FiLoader, FiTrash2 } from 'react-icons/fi';
import NotificationBell from '../../components/NotificationBell.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Api } from '../../api/Api.js';
import { toast } from 'sonner';

import AparTimeline from '../../components/AparTimeline.jsx';
import AparShellHeader from '../../components/AparShellHeader.jsx';

export default function OfficerDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.aparAuth);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { socket } = useSocket();
    const lastRefreshRef = useRef(0);
    const fileInputRef = useRef(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // 1. Replaced hardcoded CURRENT_AY with state
    const [currentAY, setCurrentAY] = useState('2026-27');

    // Defensive: ensure both ay and currentAY are strings and trimmed
    const normalizeAY = (val) =>
        String(val)
            .replace(/\s+/g, '')
            .replace(/\//g, '-')
            .trim();

    // 2. Generate a dynamic list of Academic Years for the dropdown
    const availableYears = useMemo(() => {
        const yearsSet = new Set();
        // Add the last 10 academic years based on the current date
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 10; i++) {
            const start = currentYear - i;
            const end = String(start + 1).slice(-2);
            yearsSet.add(`${start}-${end}`);
        }
        // Add any years that exist in the user's history
        history.forEach(h => {
            if (h?.ay) yearsSet.add(normalizeAY(h.ay));
        });

        // Sort descending (newest first)
        return Array.from(yearsSet).sort((a, b) => {
            const aStart = parseInt(String(a).split('-')[0]) || 0;
            const bStart = parseInt(String(b).split('-')[0]) || 0;
            return bStart - aStart;
        });
    }, [history]);

    // Derive archive years from fetched history + current AY (most recent first)
    const archiveYears = (() => {
        const yearsSet = new Set();
        if (currentAY) yearsSet.add(normalizeAY(currentAY));
        history.forEach(h => {
            if (h && h.ay) yearsSet.add(normalizeAY(h.ay));
        });
        const arr = Array.from(yearsSet);
        arr.sort((a, b) => {
            const aStart = parseInt(String(a).split('-')[0]) || 0;
            const bStart = parseInt(String(b).split('-')[0]) || 0;
            return bStart - aStart;
        });
        return arr.slice(0, 5); // last 5 years
    })();

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        try {
            const res = await AparFormGradedService.getHistory();
            const data = res.data || res; // Handle ApiResponse wrapper
            setHistory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch history', e);
        }
    }, [user]);

    useEffect(() => {
        (async () => {
            if (!user) return;
            try {
                await fetchHistory();
            } finally {
                setLoading(false);
            }
        })();
    }, [user, fetchHistory]);

    // Real-time refresh when APAR/IQAC pushes a notification
    useEffect(() => {
        if (!socket || !user) return;

        const shouldRefresh = (n) => {
            const type = (n?.type || '').toString();
            const link = (n?.link || '').toString();
            return (
                type.startsWith('APAR_') ||
                type === 'IQAC_UPDATE' ||
                link.includes('/apar')
            );
        };

        const onNotification = async (notification) => {
            if (!shouldRefresh(notification)) return;
            const now = Date.now();
            if (now - lastRefreshRef.current < 1000) return; // simple throttle
            lastRefreshRef.current = now;
            await fetchHistory();
        };

        socket.on('notification', onNotification);
        return () => socket.off('notification', onNotification);
    }, [socket, user, fetchHistory]);

    const handleLogout = async () => {
        try {
            setLogoutLoading(true);
            await dispatch(aparLogout());
            window.location.replace('/apar/login');
        } catch (e) {
            console.error(e);
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleStartOrEdit = (ay) => {
        navigate('/apar-form', { state: { ay } });
    };

    const canDeleteForm = (form) => {
        const status = form?.status || 'Draft';
        return [
            'Draft',
            'Query Raised',
            'Query Raised by Reporting officer',
            'Query Raised by Reviewing officer',
            'not_filled'
        ].includes(status);
    };

    const requestDeleteForm = (form, ay) => {
        if (!form) return;
        setDeleteTarget({
            faculty_id: form.faculty_id || user?.userId || user?.id,
            ay,
            status: form.status || 'Draft'
        });
    };

    const confirmDeleteForm = async () => {
        if (!deleteTarget) return;
        try {
            setDeleteLoading(true);
            await AparFormGradedService.deleteForm(deleteTarget.faculty_id, deleteTarget.ay);
            toast.success('APAR form deleted permanently');
            setDeleteTarget(null);
            await fetchHistory();
        } catch (err) {
            console.error('Failed to delete APAR form', err);
            toast.error(err?.response?.data?.message || 'Failed to delete APAR form');
        } finally {
            setDeleteLoading(false);
        }
    };

    console.log('APAR Dashboard Debug:', { history, currentAY });

    const computedExternalImage = (name) => `https://dtu.ac.in/modules/facilities/people/faculty/userimages/${String(name || '').replace(/^(Dr\.|Dr|Professor|Prof\.|Prof|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').toLowerCase().replace(/\s+/g, '')}.jpg`;

    const handleAvatarSelected = async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            e.target.value = '';
            return;
        }

        setAvatarUploading(true);
        try {
            const api = new Api();
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.client.post('/apar/auth/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response?.data?.data) {
                await dispatch(aparInitializeSession());
                toast.success('Profile picture updated');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Avatar upload failed', err);
            toast.error(err?.response?.data?.message || 'Avatar upload failed');
        } finally {
            setAvatarUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const currentYearForm = history.find(
        f => normalizeAY(f.ay) === normalizeAY(currentAY)
    );

    const getStatusColor = (s) => {
        if (!s) return 'bg-gray-100 text-gray-800';
        switch (s.toLowerCase()) {
            case 'submit':
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'verified':
            case 'forwarded by reporting officer': return 'bg-purple-100 text-purple-800';
            case 'reviewed':
            case 'forwarded by reviewing officer': return 'bg-green-100 text-green-800';
            case 'query raised':
            case 'query raised by reporting officer':
            case 'query raised by reviewing officer': return 'bg-yellow-100 text-yellow-800';
            case 'not filled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="apar-page-bg flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-sm">
                    <FiLoader className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-sm font-medium text-gray-600">Loading dashboard…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="apar-page-bg min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <AparShellHeader
                    title="Officer Dashboard"
                    subtitle="Manage your Annual Performance Appraisal forms"
                    backTo="/"
                    actions={
                        <>
                        <button
                            type="button"
                            onClick={() => navigate('/apar/iqac-approvals')}
                            className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50"
                        >
                            IQAC Approvals
                        </button>
                         <button
                            type="button"
                            onClick={() => navigate('/apar/profile')}
                            className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50"
                        >
                            Profile
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
                        >
                            {logoutLoading ? 'Signing out…' : 'Sign Out'}
                        </button>
                        </>
                    }
                />

                {/* Faculty Profile Image & Info */}
                {user?.name && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative">
                            <img
                                src={user?.avatar || computedExternalImage(user?.name)}
                                alt={user.name}
                                className="h-32 w-32 rounded-lg object-cover object-top shadow-md border border-gray-200"
                                onError={(e) => {
                                    try {
                                        if (user?.avatar && e.target.src === user.avatar) {
                                            e.target.onerror = null;
                                            e.target.src = computedExternalImage(user?.name);
                                            return;
                                        }
                                    } catch (ex) {}
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                                title="Change photo"
                            >
                                {avatarUploading ? <FiLoader className="animate-spin" /> : <FiCamera />}
                            </button>

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelected} className="hidden" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            {user.designation && (
                                <p className="text-lg text-indigo-600 font-medium mt-1">{user.designation}</p>
                            )}
                            {user.department && (
                                <p className="text-sm text-gray-500 mt-1 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                                    {user.department}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Selected Year Section */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg">
                    <div className="flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white sm:flex-row">
                        <h2 className="text-lg font-bold flex items-center">
                            <FiClock className="mr-2" /> Selected Academic Year
                        </h2>
                        {/* 3. Added Dropdown Selector */}
                        <select
                            value={currentAY}
                            onChange={(e) => setCurrentAY(e.target.value)}
                            className="bg-white text-indigo-700 font-bold py-2 px-4 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="p-8 text-center">
                        {currentYearForm ? (
                            <div className="flex flex-col items-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl ${currentYearForm.status?.includes('Query') ? 'bg-yellow-100 text-yellow-600' :
                                    currentYearForm.status === 'Submitted' ? 'bg-blue-100 text-blue-600' :
                                        currentYearForm.status === 'Verified' || currentYearForm.status?.includes('Forwarded') ? 'bg-green-100 text-green-600' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {currentYearForm.status?.includes('Query') ? <FiAlertCircle /> : <FiFileText />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    Status: {currentYearForm.status || 'Draft'}
                                </h3>
                                {(currentYearForm.status?.includes('Query') && (currentYearForm.reporting_query || currentYearForm.reviewing_query || currentYearForm.query_comment)) && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 max-w-lg">
                                        <p className="text-sm text-yellow-800 font-medium">Comments from Officer:</p>
                                        <p className="text-sm text-gray-700 mt-1 italic">
                                            "{currentYearForm.status === 'Query Raised by Reporting officer' ? (currentYearForm.reporting_query || currentYearForm.query_comment) :
                                                currentYearForm.status === 'Query Raised by Reviewing officer' ? (currentYearForm.reviewing_query || currentYearForm.query_comment) :
                                                    currentYearForm.query_comment}"
                                        </p>
                                    </div>
                                )}
                                <p className="text-gray-500 mb-6">
                                    Last updated: {new Date(currentYearForm.updatedAt).toLocaleDateString()}
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleStartOrEdit(currentAY)}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                                    >
                                        {currentYearForm.status === 'Submitted' || currentYearForm.status?.includes('Forwarded') || currentYearForm.status?.includes('Accepted') ? 'View Form' : 'Continue Editing'}
                                    </button>
                                    <button
                                        onClick={() => setShowStatusModal(true)}
                                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Track Status
                                    </button>
                                    {canDeleteForm(currentYearForm) && (
                                        <button
                                            type="button"
                                            onClick={() => requestDeleteForm(currentYearForm, currentAY)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-6 py-2 font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4 text-2xl border-2 border-dashed border-indigo-200">
                                    <FiPlus />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No APAR Filed Yet</h3>
                                <p className="text-gray-500 mb-6 max-w-md">
                                    You haven't started your Annual Performance Appraisal Report for the academic year {currentAY}.
                                </p>
                                <button
                                    onClick={() => handleStartOrEdit(currentAY)}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all flex items-center"
                                >
                                    <FiPlus className="mr-2" />
                                    Start New APAR
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Archive Section */}
                <div className="data-table-wrapper">
                    <div className="flex items-center border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-6 py-4">
                        <FiArchive className="mr-2 text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-800">APAR Archive (Last 5 Years)</h2>
                    </div>

                    <div className="data-table-scroll">
                        <table className="data-table data-table-apar text-left">
                            <thead>
                                <tr>
                                    <th className="!text-left">Academic Year</th>
                                    <th className="!text-left">Status</th>
                                    <th className="!text-left">Last Updated</th>
                                    <th className="!text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archiveYears.map((year) => {
                                    const form = history.find(f => normalizeAY(f.ay) === normalizeAY(year));
                                    return (
                                        <tr key={year}>
                                            <td className="!text-left whitespace-nowrap font-medium text-gray-900">{year}</td>
                                            <td className="!text-left whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(form ? form.status : 'Not Filled')}`}>
                                                    {form ? (form.status || 'Draft') : 'Not Filled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {form ? new Date(form.updatedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {form ? (
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartOrEdit(year)}
                                                            className="font-semibold text-emerald-700 hover:text-emerald-900"
                                                        >
                                                            View
                                                        </button>
                                                        {canDeleteForm(form) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => requestDeleteForm(form, year)}
                                                                className="font-semibold text-red-600 hover:text-red-800"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 cursor-not-allowed">No Record</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* History Modal */}
                {showStatusModal && currentYearForm && (
                    <div className="fixed inset-0 bg-transparent overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-md">
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 overflow-hidden transform transition-all h-[500px] flex flex-col border border-gray-100">
                            {/* Header */}
                            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <FiClock className="mr-2" /> Application Journey
                                </h3>
                                <button onClick={() => setShowStatusModal(false)} className="text-indigo-200 hover:text-white transition-colors">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {!currentYearForm.history || currentYearForm.history.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        No tracking history available yet.
                                    </div>
                                ) : (
                                    <div className="flow-root">
                                        <ul role="list" className="-mb-8">
                                            {currentYearForm.history.slice().reverse().map((event, eventIdx) => (
                                                <li key={eventIdx}>
                                                    <div className="relative pb-8">
                                                        {eventIdx !== currentYearForm.history.length - 1 ? (
                                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                                        ) : null}
                                                        <div className="relative flex space-x-3">
                                                            <div>
                                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.action?.includes('Query') ? 'bg-yellow-500' :
                                                                    event.action === 'Submitted' ? 'bg-blue-500' : 'bg-green-500'
                                                                    }`}>
                                                                    {event.action?.includes('Query') ? <FiAlertCircle className="text-white h-5 w-5" /> : <FiClock className="text-white h-5 w-5" />}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                                <div>
                                                                    <p className="text-sm text-gray-500">{event.action} <span className="font-medium text-gray-900">by {event.by}</span></p>
                                                                    {event.comment && (
                                                                        <p className="mt-1 text-sm text-gray-600 italic">"{event.comment}"</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                                    <time dateTime={event.date}>{new Date(event.date).toLocaleDateString()}</time>
                                                                    <div className="text-xs">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-start gap-3">
                                <div className="rounded-full bg-red-100 p-2 text-red-600">
                                    <FiTrash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete APAR Form</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        This will permanently delete the {deleteTarget.ay} APAR draft and all saved entries in it.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleteLoading}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteForm}
                                    disabled={deleteLoading}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
