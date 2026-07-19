// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { selectIsAuthenticated } from '../store/slices/authSlice.js';
// import {
//   FiArrowRight,
//   FiBarChart2,
//   FiClipboard,
//   FiCpu,
//   FiShield,
// } from 'react-icons/fi';

// const PORTALS = [
//   {
//     id: 'iqac',
//     badge: 'Quality Assurance',
//     badgeClass: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
//     accent: 'from-indigo-600 via-indigo-500 to-violet-500',
//     ring: 'ring-indigo-100 hover:ring-indigo-300',
//     icon: FiBarChart2,
//     title: 'IQAC Portal',
//     description:
//       'Manage institutional quality metrics, NAAC data tables, reports, and department submissions in one workspace.',
//     cta: 'Sign in to IQAC',
//     ctaAuthenticated: 'Open Dashboard',
//     onClick: (navigate, isAuthenticated) => {
//       if (isAuthenticated) navigate('/app', { replace: true });
//       else navigate('/login');
//     },
//     features: ['38+ data tables', 'Role-based access', 'Reports & analytics'],
//   },
//   {
//     id: 'apar',
//     badge: 'Performance Review',
//     badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
//     accent: 'from-emerald-600 via-teal-500 to-cyan-500',
//     ring: 'ring-emerald-100 hover:ring-emerald-300',
//     icon: FiClipboard,
//     title: 'APAR Portal',
//     description:
//       'Annual Performance Appraisal for officers, reporting officers, and reviewing officers with guided multi-part forms.',
//     cta: 'Enter APAR',
//     onClick: (navigate) => navigate('/apar/login'),
//     features: ['Multi-step wizard', 'Officer workflow', 'PDF & Word export'],
//   },
//   {
//     id: 'feedback',
//     badge: 'AI Insights',
//     badgeClass: 'bg-violet-100 text-violet-800 ring-violet-200',
//     accent: 'from-violet-600 via-purple-500 to-fuchsia-500',
//     ring: 'ring-violet-100 hover:ring-violet-300',
//     icon: FiCpu,
//     title: 'Feedback Analysis',
//     description:
//       'Upload CSV or Excel feedback forms and generate institutional insight reports powered by Hugging Face models in your browser.',
//     cta: 'Analyze Feedback',
//     onClick: (navigate) => navigate('/feedback-analysis'),
//     features: ['7 form types', 'Client-side AI', 'Markdown reports'],
//   },
// ];

// export default function LandingPage() {
//   const navigate = useNavigate();
//   const isAuthenticated = useSelector(selectIsAuthenticated);

//   return (
//     <div className="portal-page-bg min-h-screen relative overflow-hidden flex flex-col items-center">
//       <div
//         className="absolute inset-0 z-0 opacity-30"
//         style={{
//           backgroundImage: "url('/1703710559423.jpeg')",
//           backgroundSize: 'cover',
//           backgroundPosition: 'center',
//         }}
//       />
//       <div className="absolute inset-0 z-0 bg-white/75 backdrop-blur-[2px]" />

//       <div className="relative z-10 w-full max-w-6xl px-6 py-10 md:py-14">
//         <header className="mb-14 flex flex-col items-center text-center">
//           {/* Increased logo size here (h-32 md:h-40) */}
//          <img
//             src="/dtu_logo.jpeg"
//             alt="DTU Logo"
//             className="mx-auto mb-8 h-40 md:h-56 lg:h-64 w-auto object-contain drop-shadow-sm"
//           />
//           {/* Adjusted text size and tracking to ensure it fits and stays centered */}
//           <p className="mx-auto whitespace-nowrap text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold uppercase tracking-widest md:tracking-[0.2em] text-indigo-800">
//             Delhi Technological University
//           </p>
//           <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
//             Internal Quality Assurance Cell
//           </h1>
//           <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
//             One gateway for IQAC data management, APAR performance reviews, and AI-powered feedback analysis.
//           </p>
//           <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm">
//             <FiShield className="h-4 w-4 text-indigo-500" />
//             Secure, role-based access for academic staff
//           </div>
//         </header>

//         <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
//           {PORTALS.map((portal) => {
//             const Icon = portal.icon;
//             const ctaLabel =
//               portal.id === 'iqac' && isAuthenticated ? portal.ctaAuthenticated : portal.cta;

//             return (
//               <button
//                 key={portal.id}
//                 type="button"
//                 onClick={() => portal.onClick(navigate, isAuthenticated)}
//                 className={`portal-card group text-left ring-2 ${portal.ring}`}
//               >
//                 <div className={`h-1.5 w-full bg-gradient-to-r ${portal.accent}`} />
//                 <div className="p-8">
//                   <span
//                     className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${portal.badgeClass}`}
//                   >
//                     {portal.badge}
//                   </span>
//                   <div
//                     className={`mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${portal.accent}`}
//                   >
//                     <Icon className="h-7 w-7" />
//                   </div>
//                   <h2 className="mt-5 text-2xl font-bold text-gray-900">{portal.title}</h2>
//                   <p className="mt-3 text-sm leading-relaxed text-gray-600">{portal.description}</p>
//                   <ul className="mt-5 space-y-2">
//                     {portal.features.map((feature) => (
//                       <li key={feature} className="flex items-center text-xs font-medium text-gray-500">
//                         <span className={`mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r ${portal.accent}`} />
//                         {feature}
//                       </li>
//                     ))}
//                   </ul>
//                   <span
//                     className={`mt-8 inline-flex items-center text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent ${portal.accent}`}
//                   >
//                     {ctaLabel}
//                     <FiArrowRight className="ml-2 h-4 w-4 text-gray-700 transition group-hover:translate-x-1" />
//                   </span>
//                 </div>
//               </button>
//             );
//           })}
//         </section>

//         <p className="mt-12 text-center text-xs text-gray-500">
//           © DTU IQAC · NAAC compliance data & performance management
//         </p>
//       </div>
//     </div>
//   );
// }
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import {
  FiArrowRight,
  FiBarChart2,
  FiClipboard,
  FiCpu,
  FiShield,
} from 'react-icons/fi';

const PORTALS = [
  {
    id: 'iqac',
    badge: 'Quality Assurance',
    badgeClass: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
    accent: 'from-indigo-600 via-indigo-500 to-violet-500',
    ring: 'ring-indigo-100 hover:ring-indigo-300',
    icon: FiBarChart2,
    title: 'IQAC Portal',
    description:
      'Manage institutional quality metrics, NAAC data tables, reports, and department submissions in one workspace.',
    cta: 'Sign in to IQAC',
    ctaAuthenticated: 'Open Dashboard',
    onClick: (navigate, isAuthenticated) => {
      if (isAuthenticated) navigate('/app', { replace: true });
      else navigate('/login');
    },
    features: ['38+ data tables', 'Role-based access', 'Reports & analytics'],
  },
  {
    id: 'apar',
    badge: 'Performance Review',
    badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    accent: 'from-emerald-600 via-teal-500 to-cyan-500',
    ring: 'ring-emerald-100 hover:ring-emerald-300',
    icon: FiClipboard,
    title: 'APAR Portal',
    description:
      'Annual Performance Appraisal for officers, reporting officers, and reviewing officers with guided multi-part forms.',
    cta: 'Enter APAR',
    onClick: (navigate) => navigate('/apar/login'),
    features: ['Multi-step wizard', 'Officer workflow', 'PDF & Word export'],
  },
  {
    id: 'feedback',
    badge: 'AI Insights',
    badgeClass: 'bg-violet-100 text-violet-800 ring-violet-200',
    accent: 'from-violet-600 via-purple-500 to-fuchsia-500',
    ring: 'ring-violet-100 hover:ring-violet-300',
    icon: FiCpu,
    title: 'Feedback Analysis',
    description:
      'Upload CSV or Excel feedback forms and generate institutional insight reports powered by Hugging Face models in your browser.',
    cta: 'Analyze Feedback',
    onClick: (navigate) => navigate('/feedback-analysis'),
    features: ['7 form types', 'Client-side AI', 'Markdown reports'],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="portal-page-bg min-h-screen relative overflow-hidden flex flex-col items-center">
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url('/1703710559423.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-[8px]" />
      
      {/* Animated Orbs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute top-40 -right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />

      {/* Adjusted wrapper padding for mobile (px-4) and desktop (px-6) */}
      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10 md:py-14">
        <header className="mb-10 sm:mb-14 flex flex-col items-center text-center animate-fade-in-up">
          
          <div className="relative mb-6 sm:mb-8">
             <div className="absolute inset-0 bg-white/50 blur-2xl rounded-full scale-150 z-0"></div>
             <img
               src="/dtu_logo.jpeg"
               alt="DTU Logo"
               className="relative z-10 h-32 sm:h-40 md:h-56 lg:h-64 w-auto object-contain drop-shadow-md"
             />
          </div>
          
          {/* Highly responsive typography for the main title to strictly keep it on one line */}
          <p className="mx-auto whitespace-nowrap text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold uppercase tracking-wider sm:tracking-widest md:tracking-[0.2em] bg-gradient-to-r from-indigo-800 to-violet-700 bg-clip-text text-transparent">
            Delhi Technological University
          </p>
          
          <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            Internal Quality Assurance Cell
          </h1>
          
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2 font-medium">
            One gateway for IQAC data management, APAR performance reviews, and AI-powered feedback analysis.
          </p>
          
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100/50 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs sm:text-sm text-indigo-900 font-semibold shadow-md ring-1 ring-indigo-50 transition-all hover:scale-105 hover:bg-white">
            <FiShield className="h-4 w-4 text-indigo-500 animate-pulse-soft" />
            Secure, role-based access for academic staff
          </div>
        </header>

        {/* Responsive grid handles 1 column on mobile, 2 on tablet, 3 on desktop */}
        <section className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PORTALS.map((portal, index) => {
            const Icon = portal.icon;
            const ctaLabel =
              portal.id === 'iqac' && isAuthenticated ? portal.ctaAuthenticated : portal.cta;
            const delayClass = `animate-fade-in-up-delay-${index + 1}`;

            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => portal.onClick(navigate, isAuthenticated)}
                className={`portal-card group text-left relative overflow-hidden rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/70 ${delayClass}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0" />
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${portal.accent}`} />
                {/* Responsive padding inside the cards */}
                <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide ring-1 ${portal.badgeClass}`}
                  >
                    {portal.badge}
                  </span>
                  <div
                    className={`mt-5 sm:mt-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${portal.accent}`}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h2 className="mt-4 sm:mt-5 text-xl sm:text-2xl font-bold text-gray-900">{portal.title}</h2>
                  <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-gray-600">{portal.description}</p>
                  <ul className="mt-4 sm:mt-5 space-y-2">
                    {portal.features.map((feature) => (
                      <li key={feature} className="flex items-center text-xs font-medium text-gray-500">
                        <span className={`mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r ${portal.accent}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span
                    className={`mt-6 sm:mt-8 inline-flex items-center text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent ${portal.accent}`}
                  >
                    {ctaLabel}
                    <FiArrowRight className="ml-2 h-4 w-4 text-gray-700 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <p className="mt-10 sm:mt-12 pb-6 text-center text-xs text-gray-500">
          © DTU IQAC · NAAC compliance data & performance management
        </p>
      </div>
    </div>
  );
}