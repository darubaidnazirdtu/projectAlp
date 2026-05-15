import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  login as loginThunk,
  selectAuthStatus,
  selectAuthError,
  selectInitializeStatus,
  selectIsAuthenticated
} from '../../store/slices/authSlice.js';
import { authService } from '../../services/auth.service.js';
import { ROLES } from '../../config/rolePermissions.js';

export default function Login() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authStatus = useSelector(selectAuthStatus);
  const initializeStatus = useSelector(selectInitializeStatus);
  const globalError = useSelector(selectAuthError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.DEPARTMENT_HOD);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetTeacherId, setResetTeacherId] = useState('');
  const [resetPassword, setResetPassword] = useState('12345');
  const [resetError, setResetError] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app';
  const roleOptions = [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD];

  if (initializeStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
        <span className="text-sm font-medium text-gray-600">Preparing sign-in…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!selectedRole) {
      setError('Please choose your role for this session.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    const action = await dispatch(loginThunk({ email: normalizedEmail, password, role: selectedRole }));

    if (loginThunk.fulfilled.match(action)) {
      navigate(from, { replace: true });
    } else {
      const message = action.payload || 'Invalid credentials. Please try again.';
      setError(message);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setResetError('');

    const normalizedTeacherId = resetTeacherId.trim();

    if (!normalizedTeacherId) {
      setResetError('Please enter the Teacher ID linked to the account.');
      return;
    }

    const normalizedPassword = resetPassword.trim();

    if (!normalizedPassword) {
      setResetError('Please enter the new password to apply.');
      return;
    }

    setResetStatus('loading');
    try {
      await authService.forgotPassword(normalizedTeacherId, normalizedPassword);
      setResetStatus('succeeded');
      setShowReset(false);
      setResetTeacherId('');
      setResetPassword('12345');
    } catch (resetException) {
      const message =
        resetException?.response?.data?.message ||
        resetException.message ||
        'Unable to reset password';
      setResetError(message);
      setResetStatus('failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
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

      <div className="relative z-10 max-w-md w-full space-y-5 bg-white/90 shadow-xl rounded-2xl p-8">
        <div className="text-center space-y-2">
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-20 w-auto mx-auto object-contain mb-2" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500">Sign in with your institutional email and password (default is 12345).</p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError('');
                }}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="name@college.edu"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Sign in as
              </label>
              <select
                id="role"
                name="role"
                value={selectedRole}
                onChange={(event) => {
                  setSelectedRole(event.target.value);
                  if (error) setError('');
                }}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError('');
                }}
                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="12345"
              />
            </div>
          </div>

          {(error || globalError) && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {error || globalError}
            </p>
          )}

          <button
            type="submit"
            disabled={authStatus === 'loading'}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {authStatus === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => {
                setShowReset((prev) => !prev);
                setResetError('');
              }}
              className="text-indigo-600 font-medium hover:underline"
            >
              {showReset ? 'Hide forgot password' : 'Forgot password?'}
            </button>
          </div>

        </form>

        {showReset && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-indigo-700">Reset password</h2>
            <p className="text-xs text-indigo-600">
              Enter the Teacher ID linked to the account and the new password to apply. Leave the password as 12345 if you want to restore the default.
            </p>
            <form className="space-y-3" onSubmit={handlePasswordReset}>
              <div>
                <label htmlFor="reset-teacher-id" className="block text-xs font-medium text-indigo-700">
                  Teacher ID
                </label>
                <input
                  id="reset-teacher-id"
                  type="text"
                  list="teacher-id-options"
                  value={resetTeacherId}
                  onChange={(event) => setResetTeacherId(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  placeholder="FAC123"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="reset-password" className="block text-xs font-medium text-indigo-700">
                  New password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  placeholder="12345"
                />
              </div>

              {resetError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {resetError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={resetStatus === 'loading'}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                >
                  {resetStatus === 'loading' ? 'Resetting…' : 'Reset password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
