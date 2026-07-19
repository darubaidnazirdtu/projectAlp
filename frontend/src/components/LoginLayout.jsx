import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

const VARIANTS = {
  iqac: {
    badge: 'IQAC Portal',
    badgeClass: 'text-indigo-600',
    accentBar: 'from-indigo-600 via-violet-500 to-indigo-400',
    ring: 'ring-indigo-100',
    glow: 'shadow-indigo-200/50',
    overlay: 'bg-gradient-to-br from-indigo-50/90 via-white/85 to-violet-50/80',
    button: 'bg-[length:200%_auto] bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:ring-indigo-500 animate-gradient shadow-lg shadow-indigo-200/50 hover:-translate-y-[2px] transition-all duration-300',
    inputFocus: 'focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 hover:border-indigo-300 transition-all duration-300',
    loadingBg: 'from-indigo-100 via-white to-violet-100',
  },
  apar: {
    badge: 'APAR Portal',
    badgeClass: 'text-emerald-600',
    accentBar: 'from-emerald-600 via-teal-500 to-cyan-500',
    ring: 'ring-emerald-100',
    glow: 'shadow-emerald-200/50',
    overlay: 'bg-gradient-to-br from-emerald-50/90 via-white/85 to-teal-50/80',
    button: 'bg-[length:200%_auto] bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 focus:ring-emerald-500 animate-gradient shadow-lg shadow-emerald-200/50 hover:-translate-y-[2px] transition-all duration-300',
    inputFocus: 'focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 hover:border-emerald-300 transition-all duration-300',
    loadingBg: 'from-emerald-100 via-white to-teal-100',
  },
};

export function LoginField({ label, htmlFor, children, variant = 'iqac' }) {
  const v = VARIANTS[variant] || VARIANTS.iqac;
  return (
    <div className="form-field-group">
      <label htmlFor={htmlFor} className="form-field-label">
        {label}
      </label>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
            ? React.cloneElement(child, {
                className: `form-field-input bg-white/50 border border-gray-200/80 shadow-sm ${v.inputFocus} ${child.props.className || ''}`.trim(),
              })
            : child
      )}
    </div>
  );
}

export function LoginLayout({
  variant = 'iqac',
  title = 'Welcome back',
  subtitle = 'Sign in with your institutional email and password.',
  children,
  loading = false,
  loadingMessage = 'Preparing sign-in…',
}) {
  const v = VARIANTS[variant] || VARIANTS.iqac;

  if (loading) {
    return (
      <div className={`login-page flex min-h-screen items-center justify-center bg-gradient-to-br ${v.loadingBg}`}>
        <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-6 py-4 shadow-lg">
          <div className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${variant === 'apar' ? 'border-emerald-600' : 'border-indigo-600'}`} />
          <span className="text-sm font-medium text-gray-600">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute top-4 left-4 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: "url('/1703710559423.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className={`absolute inset-0 z-0 ${v.overlay} backdrop-blur-sm`} />

      {/* Animated Orbs for Login */}
      <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float ${variant === 'apar' ? 'bg-emerald-300' : 'bg-indigo-300'}`} />
      <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float-delayed ${variant === 'apar' ? 'bg-teal-300' : 'bg-violet-300'}`} />

      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white/70 shadow-2xl border border-white/60 ${v.glow} backdrop-blur-2xl animate-fade-in-up`}
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${v.accentBar}`} />

        <div className="space-y-6 p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-white/50">
              <img src="/dtu_logo.jpeg" alt="DTU" className="h-12 w-auto object-contain" />
            </div>
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${v.badgeClass}`}>{v.badge}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs text-gray-500">
            <FiShield className={`h-4 w-4 shrink-0 ${variant === 'apar' ? 'text-emerald-500' : 'text-indigo-500'}`} />
            Secure institutional sign-in
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export default LoginLayout;
