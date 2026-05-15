import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectInitializeStatus } from '../store/slices/authSlice.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initializeStatus = useSelector(selectInitializeStatus);

  if (initializeStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="text-sm font-medium text-gray-500">Checking session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
