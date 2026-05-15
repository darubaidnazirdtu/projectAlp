import React from 'react';
import { useSelector } from 'react-redux';
import { canAccessForm } from '../config/rolePermissions.js';
import { selectInitializeStatus, selectRole } from '../store/slices/authSlice.js';
import AccessDenied from './AccessDenied.jsx';

export default function RoleProtected({ resourceId, children }) {
  const role = useSelector(selectRole);
  const initializeStatus = useSelector(selectInitializeStatus);

  if (initializeStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm font-medium text-gray-500">Loading…</span>
      </div>
    );
  }

  if (!canAccessForm(role, resourceId)) {
    return <AccessDenied message="You cannot access this form with your current role." />;
  }

  return children;
}
