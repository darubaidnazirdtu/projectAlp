import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaKey, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { aparLogout, aparChangePassword } from '../store/slices/aparAuthSlice.js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
            navigate('/apar/login');
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

        if (passwordData.newPassword.length < 5) {
            toast.error("Password must be at least 5 characters long");
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
                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 focus:outline-none transition-colors"
            >
                <FaUserCircle size={28} />
                <span className="font-medium hidden sm:inline">Profile</span>
                <FaChevronDown size={12} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 origin-top-right transform transition-all">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FaKey className="mr-3 text-gray-500" />
                        Reset Password
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <FaSignOutAlt className="mr-3 text-red-500" />
                        Logout
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
                                >
                                    {isLoading ? 'Processing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
