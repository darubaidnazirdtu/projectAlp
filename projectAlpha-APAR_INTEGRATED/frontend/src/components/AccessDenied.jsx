import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessDenied({ message = 'You do not have permission to view this content.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-3xl font-semibold text-gray-800">Access Restricted</h1>
        <p className="text-gray-500">{message}</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
}
