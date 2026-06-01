import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import NotificationBell from './NotificationBell.jsx';

export default function AparShellHeader({
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Home',
  actions,
  children,
}) {
  return (
    <header className="apar-shell-header mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <FiArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-4">
            <img src="/dtu_logo.jpeg" alt="DTU" className="h-14 w-auto object-contain rounded-lg bg-white p-1 shadow-sm" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">APAR Portal</p>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <NotificationBell />
          {actions}
        </div>
      </div>
      {children}
    </header>
  );
}
