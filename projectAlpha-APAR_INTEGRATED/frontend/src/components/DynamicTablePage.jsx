import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { resourceMap } from '../config/tableConfig';
import TablePage from '../components/TablePage';
import NotFound from '../components/NotFound';
import AccessDenied from './AccessDenied.jsx';
import { canAccessTable } from '../config/rolePermissions.js';
import { selectRole, selectInitializeStatus } from '../store/slices/authSlice.js';

export default function DynamicTablePage() {
  const { resourceId } = useParams();
  const role = useSelector(selectRole);
  const initializeStatus = useSelector(selectInitializeStatus);

  const resourceConfig = resourceMap.get(resourceId);

  if (!resourceConfig) {
    return <NotFound />;
  }

  if (initializeStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm font-medium text-gray-500">Loading…</span>
      </div>
    );
  }

  if (!canAccessTable(role, resourceId)) {
    return <AccessDenied />;
  }

  return <TablePage key={resourceId} config={resourceConfig} />;
}