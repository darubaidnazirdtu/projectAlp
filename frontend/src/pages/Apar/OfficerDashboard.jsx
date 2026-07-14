import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AparFormGradedService } from '../../services/apar_form_graded.services.js';
import { aparLogout, aparInitializeSession } from '../../store/slices/aparAuthSlice.js';
import { FiAlertCircle, FiClock, FiFileText, FiArchive, FiPlus, FiCamera, FiLoader, FiTrash2, FiMail, FiHash, FiBriefcase } from 'react-icons/fi';
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
    const avatarSrc = user?.avatar?.startsWith('profilepicture/')
        ? `${new Api().client.defaults.baseURL}/apar/mongo/document?path=${encodeURIComponent(user.avatar)}`
        : user?.avatar || computedExternalImage(user?.name);

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
                            className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
                        >
                            IQAC Approvals
                        </button>
                         <button
                            type="button"
                            onClick={() => navigate('/apar/profile')}
                            className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
                        >
                            Profile
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="rounded-xl border border-red-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                        >
                            {logoutLoading ? 'Signing out…' : 'Sign Out'}
                        </button>
                        </>
                    }
                />

                {/* Faculty Profile Image & Info */}
                {user?.name && (
                    <div className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
                        {/* Decorative Background Blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="relative h-32 w-32 rounded-2xl object-cover object-top shadow-lg border-2 border-white transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    try {
                                        if (user?.avatar) {
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
                                className="absolute -bottom-2 -right-2 bg-white/90 backdrop-blur text-indigo-600 p-2.5 rounded-xl shadow-lg border border-indigo-50 hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95 z-10"
                                title="Change photo"
                            >
                                {avatarUploading ? <FiLoader className="animate-spin" /> : <FiCamera />}
                            </button>

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelected} className="hidden" />
                        </div>
                        <div className="text-center relative z-10 flex-1">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user.name}</h2>
                            {user.designation && (
                                <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-bold mt-1.5">{user.designation}</p>
                            )}
                            
                            <div className="mt-5 flex flex-wrap justify-center gap-3">
                                {user.department && (
                                    <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/60 text-sm font-semibold text-gray-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                                        <FiBriefcase className="text-indigo-500 h-4 w-4" />
                                        {user.department}
                                    </div>
                                )}
                                {user.user_id && (
                                    <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/60 text-sm font-semibold text-gray-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                                        <FiHash className="text-indigo-500 h-4 w-4" />
                                        ID: {user.user_id}
                                    </div>
                                )}
                                {user.email && (
                                    <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/60 text-sm font-semibold text-gray-700 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                                        <FiMail className="text-indigo-500 h-4 w-4" />
                                        {user.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Year Section */}
                <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-5 sm:flex-row">
                        <h2 className="text-lg font-bold flex items-center text-gray-800">
                            <FiClock className="mr-2 text-indigo-600" /> APAR Status
                        </h2>
                        {/* 3. Added Dropdown Selector */}
                        <div className="relative">
                            <select
                                value={currentAY}
                                onChange={(e) => setCurrentAY(e.target.value)}
                                className="appearance-none bg-white text-gray-800 font-bold py-2.5 pl-4 pr-10 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none cursor-pointer transition-all hover:border-gray-300 hover:shadow-md"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year} Academic Year</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
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
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={() => handleStartOrEdit(currentAY)}
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
                                    >
                                        {currentYearForm.status === 'Submitted' || currentYearForm.status?.includes('Forwarded') || currentYearForm.status?.includes('Accepted') ? 'View APAR Form' : 'Continue Editing'}
                                    </button>
                                    <button
                                        onClick={() => setShowStatusModal(true)}
                                        className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        Track Journey
                                    </button>
                                    {canDeleteForm(currentYearForm) && (
                                        <button
                                            type="button"
                                            onClick={() => requestDeleteForm(currentYearForm, currentAY)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-6 py-2.5 font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md hover:-translate-y-0.5"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                            Delete Draft
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
                                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 flex items-center"
                                >
                                    <FiPlus className="mr-2 h-5 w-5" />
                                    Start New APAR
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Archive Section */}
                <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center border-b border-gray-100 bg-gray-50/50 px-6 py-5">
                        <FiArchive className="mr-2.5 text-indigo-600 h-5 w-5" />
                        <h2 className="text-lg font-bold text-gray-800">APAR Archive</h2>
                        <span className="ml-3 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">Last 5 Years</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Academic Year</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Updated</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {archiveYears.map((year) => {
                                    const form = history.find(f => normalizeAY(f.ay) === normalizeAY(year));
                                    return (
                                        <tr key={year} className="hover:bg-indigo-50/30 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{year}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                                                    !form ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                    form.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    form.status?.includes('Forwarded') || form.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    form.status?.includes('Query') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                    {form ? (form.status || 'Draft') : 'Not Filled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                                {form ? new Date(form.updatedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                                {form ? (
                                                    <div className="flex justify-end gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartOrEdit(year)}
                                                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                        {canDeleteForm(form) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => requestDeleteForm(form, year)}
                                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 cursor-not-allowed">No Record</span>
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
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-all duration-300">
                        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] max-w-lg w-full m-4 overflow-hidden transform transition-all h-[550px] flex flex-col border border-white/60">
                            {/* Premium Header */}
                            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-8 py-6 flex items-center justify-between shrink-0 shadow-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                        <FiClock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-wide">Application Journey</h3>
                                        <p className="text-indigo-100 text-xs mt-0.5 font-medium">Timeline of your APAR progress</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowStatusModal(false)} className="relative z-10 text-white/70 hover:text-white transition-all p-2 hover:bg-white/20 rounded-xl hover:rotate-90 duration-300">
                                    <span className="text-2xl leading-none">&times;</span>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50/50 to-white">
                                {!currentYearForm.history || currentYearForm.history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-80">
                                        <FiClock className="w-12 h-12 mb-4 text-gray-300" />
                                        <p className="font-medium text-lg">No history available</p>
                                        <p className="text-sm">Tracking will start once actions are taken.</p>
                                    </div>
                                ) : (
                                    <div className="flow-root mt-2">
                                        <ul role="list" className="-mb-8">
                                            {currentYearForm.history.slice().reverse().map((event, eventIdx) => (
                                                <li key={eventIdx}>
                                                    <div className="relative pb-10">
                                                        {eventIdx !== currentYearForm.history.length - 1 ? (
                                                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gradient-to-b from-indigo-200 to-transparent" aria-hidden="true"></span>
                                                        ) : null}
                                                        <div className="relative flex space-x-4 items-start group">
                                                            <div className="relative z-10">
                                                                <span className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 ${
                                                                    event.action?.includes('Query') 
                                                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200/50 ring-4 ring-orange-50' 
                                                                        : event.action === 'Submitted' || event.action?.includes('Forwarded')
                                                                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-200/50 ring-4 ring-blue-50' 
                                                                            : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/50 ring-4 ring-emerald-50'
                                                                    }`}>
                                                                    {event.action?.includes('Query') ? <FiAlertCircle className="text-white h-5 w-5" /> : <FiClock className="text-white h-5 w-5" />}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1 pt-0.5 flex flex-col sm:flex-row sm:justify-between sm:space-x-4">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-gray-800">
                                                                        {event.action}
                                                                    </p>
                                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                                        by <span className="text-indigo-600">{event.by}</span>
                                                                    </p>
                                                                    {event.comment && (
                                                                        <div className="mt-2 text-sm text-gray-600 italic bg-white border border-gray-100 p-3 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative">
                                                                            <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-t border-gray-100 transform -rotate-45"></div>
                                                                            "{event.comment}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-left sm:text-right text-xs whitespace-nowrap text-gray-400 mt-2 sm:mt-0 font-medium bg-gray-50 px-2.5 py-1 rounded-lg h-fit border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                                    <time dateTime={event.date} className="block">{new Date(event.date).toLocaleDateString()}</time>
                                                                    <div className="text-[10px] uppercase mt-0.5">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm transition-opacity duration-300">
                        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white/95 backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(220,38,38,0.15)] transform transition-all duration-300">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="rounded-2xl bg-red-50 p-3 text-red-600 border border-red-100 shadow-inner">
                                    <FiTrash2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Delete APAR Form</h3>
                                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                        This will permanently delete the <span className="font-bold text-gray-900">{deleteTarget.ay}</span> APAR draft and all saved entries in it. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleteLoading}
                                    className="rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 shadow-sm disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteForm}
                                    disabled={deleteLoading}
                                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60 hover:shadow-lg hover:-translate-y-0.5"
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
