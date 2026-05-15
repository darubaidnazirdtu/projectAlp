import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import { FiExternalLink, FiArrowRight, FiGitBranch } from 'react-icons/fi';

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleIqacClick = () => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
      return;
    }

    navigate('/login');
  };

  const handleAparClick = () => {
    navigate('/apar/login');
  };

  return (
    <div className="min-h-screen relative">
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
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-white/70 z-0" />

      <div className="max-w-5xl mx-auto px-6 py-2 relative z-10">
        <header className="text-center mb-12">
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-50 w-auto mx-auto object-contain mb-2" />
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-800">
            Welcome to
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900">
            IQAC Data Management Suite
          </h1>
          <p className="mt-4 text-lg text-gray-800 max-w-2xl mx-auto font-medium">
            Choose the platform you want to explore. You can access the IQAC
            portal or jump to the APAR system for performance reviews.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={handleAparClick}
            className="flex flex-col justify-between p-8 bg-white/90 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left border border-white/50"
          >
            <div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                Performance Portal
              </span>
              <h2 className="mt-6 text-3xl font-bold text-gray-800">APAR</h2>
              <p className="mt-4 text-base text-gray-600">
                Annual Performance Appraisal Reporting for academic and
                administrative staff.
              </p>
            </div>
            <span className="mt-10 inline-flex items-center text-sm font-semibold text-green-700">
              Fill APAR Form
              <FiArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleIqacClick}
            className="flex flex-col justify-between p-8 bg-white/90 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left border border-white/50"
          >
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                IQAC Portal
              </span>
              <h2 className="mt-6 text-3xl font-bold text-gray-800">IQAC</h2>
              <p className="mt-4 text-base text-gray-600">
                {isAuthenticated
                  ? 'Continue to your dashboard and manage institutional quality metrics.'
                  : 'Log in to manage institutional quality metrics, submissions, and analytics.'}
              </p>
            </div>
            <span className="mt-10 inline-flex items-center text-sm font-semibold text-indigo-700">
              {isAuthenticated ? 'Go to Dashboard' : 'Sign in to IQAC'}
              <FiArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/feedback-analysis')}
            className="flex flex-col justify-between p-8 bg-white/90 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left border border-white/50"
          >
            <div>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
                AI Feedback Analysis
              </span>
              <h2 className="mt-6 text-3xl font-bold text-gray-800">Feedback</h2>
              <p className="mt-4 text-base text-gray-600">
                AI-powered analysis of institutional feedback and sentiment tracking.
              </p>
            </div>
            <span className="mt-10 inline-flex items-center text-sm font-semibold text-purple-700">
              Analyze Feedback
              <FiArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
