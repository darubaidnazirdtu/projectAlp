import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { aparLogin } from '../store/slices/aparAuthSlice.js';
import { aparAuthService } from '../services/aparAuth.service.js';

export default function AparLogin({ loginData, setLoginData }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => Boolean(state.aparAuth.user));
  const aparRole = useSelector((state) => state.aparAuth.role);
  const status = useSelector((state) => state.aparAuth.status);
  const authError = useSelector((state) => state.aparAuth.error);
  const [localError, setLocalError] = useState('');

  // support standalone usage: if parent doesn't provide loginData, manage locally
  const [localLoginData, setLocalLoginData] = useState({ id: '', password: '', role: 'Officer (Graded)' });
  const effectiveLoginData = loginData ?? localLoginData;
  const effectiveSetLoginData = setLoginData ?? setLocalLoginData;
  const [showReset, setShowReset] = useState(false);
  const [resetTeacherId, setResetTeacherId] = useState(effectiveLoginData.id || '');
  const [resetPassword, setResetPassword] = useState('12345');
  const [resetError, setResetError] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');

  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname;
      const roleToUse = aparRole || effectiveLoginData.role;
      if (roleToUse === 'Reporting Officer' || roleToUse === 'Reviewing Officer') {
        navigate('/apar/reporting', { replace: true });
        return;
      }
      navigate('/apar/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    setResetTeacherId(effectiveLoginData.id || '');
  }, [effectiveLoginData.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!effectiveLoginData.id || !effectiveLoginData.password || !effectiveLoginData.role) {
      setLocalError('All fields are required');
      return;
    }

    dispatch(aparLogin({ email: effectiveLoginData.id, password: effectiveLoginData.password, role: effectiveLoginData.role }));
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');

    const normalizedTeacherId = (resetTeacherId || '').trim();
    if (!normalizedTeacherId) {
      setResetError('Please enter the Teacher ID linked to the account.');
      return;
    }

    const normalizedPassword = (resetPassword || '').trim();
    if (!normalizedPassword) {
      setResetError('Please enter the new password to apply.');
      return;
    }

    setResetStatus('loading');
    try {
      await aparAuthService.forgotPassword(normalizedTeacherId, normalizedPassword);
      setResetStatus('succeeded');
      setShowReset(false);
      setResetTeacherId('');
      setResetPassword('12345');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Unable to reset password';
      setResetError(message);
      setResetStatus('failed');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Back to Home Button at Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
          <span className="mr-1">←</span> Back to Home
        </Link>
      </div>

      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/1703710559423.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/70 z-0" />

      <div className="relative z-10 mt-4 sm:mx-auto sm:w-full sm:max-w-md font-sans">
        <div className="text-center mb-4">
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-20 w-auto mx-auto object-contain mb-1" />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">DTU APAR Login</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to access the Annual Performance Appraisal Report system</p>
        </div>
        <div className="bg-white/90 py-5 px-8 shadow-2xl sm:rounded-2xl sm:px-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1"> Login ID </label>
              <div className="mt-1">
                <input id="id" name="id" type="text" required className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200" value={effectiveLoginData.id} onChange={(e) => effectiveSetLoginData({ ...effectiveLoginData, id: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1"> Password </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200" value={effectiveLoginData.password} onChange={(e) => effectiveSetLoginData({ ...effectiveLoginData, password: e.target.value })} />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1"> Role </label>
              <div className="mt-1">
                <select id="role" name="role" className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm transition-all duration-200" value={effectiveLoginData.role} onChange={(e) => effectiveSetLoginData({ ...effectiveLoginData, role: e.target.value })}>
                  <option>Officer (Graded)</option>
                  <option>Reporting Officer</option>
                  <option>Reviewing Officer</option>
                </select>
              </div>
            </div>

            {(localError) && (<div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">{localError}</div>)}

            <div>
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:-translate-y-0.5" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in...' : 'Sign in to APAR'}
              </button>
            </div>

            <div className="text-sm text-center mt-4">
              <button
                type="button"
                onClick={() => { setShowReset((prev) => !prev); setResetError(''); }}
                className="text-indigo-600 font-medium hover:text-indigo-500 hover:underline transition-colors"
              >
                {showReset ? 'Hide forgot password' : 'Forgot password?'}
              </button>
            </div>
          </form>
        </div>
        {showReset && (
          <div className="mt-6 rounded-xl border border-indigo-100 bg-white/90 p-6 shadow-lg">
            <h2 className="text-sm font-bold text-indigo-700 mb-2">Reset password</h2>
            <p className="text-xs text-gray-600 mb-4">Enter the Teacher ID linked to the account and the new password to apply. Leave the password as 12345 to restore the default.</p>
            <form className="space-y-4" onSubmit={handlePasswordReset}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teacher ID</label>
                <input type="text" className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" value={resetTeacherId} onChange={(e) => setResetTeacherId(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
                <input type="password" className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
              </div>
              {resetError && (<div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{resetError}</div>)}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={resetStatus === 'loading'} className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors">{resetStatus === 'loading' ? 'Resetting…' : 'Reset password'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
