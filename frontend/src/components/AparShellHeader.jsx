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
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
          >
            <FiArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-4">
            <img src="/dtu_logo.jpeg" alt="DTU" className="h-14 w-auto object-contain rounded-xl bg-white/90 p-1.5 shadow-sm border border-gray-100" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-0.5">APAR Portal</p>
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm font-medium text-gray-500">{subtitle}</p>}
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
