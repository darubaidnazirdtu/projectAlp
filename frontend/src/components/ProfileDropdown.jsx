import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaKey, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { aparLogout, aparChangePassword } from '../store/slices/aparAuthSlice.js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getMinPasswordLength, validatePasswordPolicy } from '../utils/passwordPolicy.js';

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const modalRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await dispatch(aparLogout()).unwrap();
            // Force a full page load to ensure any server-side session/csrf state is cleared
            window.location.replace('/apar/login');
        } catch (e) {
            console.error('logout failed', e);
            toast.error('Logout failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        const passwordError = validatePasswordPolicy(passwordData.newPassword);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        try {
            setIsLoading(true);
            await dispatch(aparChangePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            })).unwrap();

            toast.success("Password changed successfully");
            setIsModalOpen(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            toast.error(typeof err === 'string' ? err : "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-50 pointer-events-auto" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 focus:outline-none transition-all group"
            >
                <div className="p-1.5 bg-gray-100 rounded-xl group-hover:bg-indigo-50 transition-colors">
                    <FaUserCircle size={22} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <span className="font-semibold hidden sm:inline tracking-wide">Profile</span>
                <FaChevronDown size={12} className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-gray-400'}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 py-2 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-200">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/apar/profile');
                        }}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                            <FaUserCircle className="text-indigo-600 text-lg" />
                        </div>
                        My Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                            <FaKey className="text-blue-600 text-sm" />
                        </div>
                        Reset Password
                    </button>
                    <div className="border-t border-gray-100 my-1 mx-4"></div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                            <FaSignOutAlt className="text-red-500 text-sm" />
                        </div>
                        Logout
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div ref={modalRef} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 max-w-md w-full p-8 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        <div className="flex justify-between items-center mb-6 mt-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <FaKey className="text-blue-600 w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Reset Password</h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition-all text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-300 text-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={getMinPasswordLength()}
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-300 text-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={getMinPasswordLength()}
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-300 text-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100/50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200/80 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center"
                                >
                                    {isLoading ? (
                                        <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2"></span> Updating...</>
                                    ) : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
