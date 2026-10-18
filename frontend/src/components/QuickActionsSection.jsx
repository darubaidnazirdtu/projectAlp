import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, FiSearch, FiX, FiChevronDown, FiChevronUp, 
  FiStar, FiFileText, FiUsers, FiAward, FiBookOpen, 
  FiDollarSign, FiLayers, FiCompass
} from 'react-icons/fi';

const CATEGORY_MAP = {
  // Research & Innovation
  books_chapters_published: 'research',
  conference_research_papers: 'research',
  journal_research_papers: 'research',
  patents: 'research',
  phd_defences: 'research',
  research_innovation_awards: 'research',

  // Faculty & Staff
  capability_enhancement_schemes: 'faculty',
  faculty_development_programs: 'faculty',
  faculty_visits: 'faculty',
  professional_affiliations: 'faculty',
  professional_staff_trainings: 'faculty',
  staff_trainings: 'faculty',
  teachers_using_ict: 'faculty',
  student_centric_methods: 'faculty',

  // Students & Support
  students: 'students',
  students_competitive_exams: 'students',
  students_higher_education_placements: 'students',
  student_financial_support_events: 'students',
  student_performance_activities: 'students',
  mentor_stress_support_sessions: 'students',

  // Academics & Depts
  courses: 'academics',
  departments: 'academics',
  dept_library_books: 'academics',
  dept_professional_schemes: 'academics',
  developed_e_contents: 'academics',
  extension_outreach_activities: 'academics',
  it_infrastructure_stock_items: 'academics',
  programmes: 'academics',
  programmes_with_field_research: 'academics',

  // Finance & Collaboration
  collaborative_activities: 'finance',
  collaborative_research_exchanges: 'finance',
  financial_support_events: 'finance',
  functional_mous: 'finance',
  research_funding_grants: 'finance',
  revenue_from_consultancies: 'finance',
  revenue_from_corporate_trainings: 'finance',
};

const POPULAR_IDS = new Set([
  'journal_research_papers',
  'conference_research_papers',
  'books_chapters_published',
  'faculty_development_programs',
  'patents',
  'functional_mous',
  'research_funding_grants',
  'students',
]);

const TABS = [
  { id: 'popular', label: 'Frequently Used', icon: FiStar },
  { id: 'research', label: 'Research & Innovation', icon: FiFileText },
  { id: 'faculty', label: 'Faculty & Staff', icon: FiUsers },
  { id: 'students', label: 'Students & Support', icon: FiAward },
  { id: 'academics', label: 'Academics & Depts', icon: FiBookOpen },
  { id: 'finance', label: 'Finance & MOUs', icon: FiDollarSign },
  { id: 'all', label: 'All Actions', icon: FiLayers },
];

const INITIAL_LIMIT = 6;

const QuickActionButton = ({ resource }) => {
  const IconComponent = resource.icon;
  return (
    <Link
      to={resource.addPath}
      className="group relative flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200/90 hover:border-indigo-400 hover:shadow-md hover:bg-gradient-to-r hover:from-white hover:to-indigo-50/20 transition-all duration-200 text-left active:scale-[0.99] min-h-[76px]"
      title={resource.addLabel}
    >
      <div className="flex items-center min-w-0 flex-1 mr-2">
        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 flex items-center justify-center shrink-0 mr-3.5 shadow-2xs">
          {IconComponent ? <IconComponent size={20} /> : <FiArrowRight size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wider uppercase text-indigo-600/90 group-hover:text-indigo-700 transition-colors truncate mb-0.5">
            {resource.category || 'Quick Form'}
          </span>
          <span className="block font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
            {resource.addLabel}
          </span>
        </div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all flex items-center justify-center shrink-0">
        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
};

export default function QuickActionsSection({ quickActions = [] }) {
  const [activeTab, setActiveTab] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Dynamic counts for tabs based on allowed actions
  const tabCounts = useMemo(() => {
    const counts = {
      all: quickActions.length,
      popular: quickActions.filter((r) => POPULAR_IDS.has(r.id)).length,
      research: 0,
      faculty: 0,
      students: 0,
      academics: 0,
      finance: 0,
    };
    quickActions.forEach((r) => {
      const cat = CATEGORY_MAP[r.id];
      if (cat && counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [quickActions]);

  // Filter actions based on tab and search
  const filteredActions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      return quickActions.filter((resource) => {
        const titleMatch = resource.title?.toLowerCase().includes(query);
        const labelMatch = resource.addLabel?.toLowerCase().includes(query);
        const categoryMatch = resource.category?.toLowerCase().includes(query);
        const keywordMatch = resource.keywords?.some((k) => k.toLowerCase().includes(query));
        return titleMatch || labelMatch || categoryMatch || keywordMatch;
      });
    }

    if (activeTab === 'popular') {
      const popular = quickActions.filter((r) => POPULAR_IDS.has(r.id));
      return popular.length > 0 ? popular : quickActions.slice(0, 8);
    }

    if (activeTab === 'all') {
      return quickActions;
    }

    return quickActions.filter((r) => CATEGORY_MAP[r.id] === activeTab);
  }, [quickActions, activeTab, searchQuery]);

  // Limit visible items on 'all' tab or large sets unless expanded or searching
  const isSearchActive = Boolean(searchQuery.trim());
  const isAllTab = activeTab === 'all';
  const shouldLimit = !isSearchActive && isAllTab && !showAll && filteredActions.length > INITIAL_LIMIT;
  const visibleActions = shouldLimit ? filteredActions.slice(0, INITIAL_LIMIT) : filteredActions;

  if (!quickActions || quickActions.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No quick actions available for your role.
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
      {/* Header with Title and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-800">Quick Form Actions</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {quickActions.length} available
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Choose a domain tab below or search to quickly find and launch any data entry form.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action (e.g. patent, paper)..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Hidden while actively searching) */}
      {!isSearchActive && (
        <div className="flex flex-wrap items-center gap-2 py-4 border-b border-gray-100/70">
          {TABS.map((tab) => {
            const count = tabCounts[tab.id] ?? 0;
            if (count === 0 && tab.id !== 'all') return null;
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowAll(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                }`}
              >
                <TabIcon size={14} className={isActive ? 'text-white' : 'text-gray-500'} />
                <span>{tab.label}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-indigo-700/70 text-indigo-100' : 'bg-gray-200/80 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search Result Info */}
      {isSearchActive && (
        <div className="py-3 flex items-center justify-between text-xs text-gray-600 border-b border-gray-100/70 mb-3">
          <span>
            Found <strong className="text-gray-900">{filteredActions.length}</strong> matching actions for "
            <span className="text-indigo-600 font-medium">{searchQuery}</span>"
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Actions Grid: 2 columns on tablet/laptop, 3 columns on wide desktop */}
      {visibleActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-4">
          {visibleActions.map((resource) => (
            <QuickActionButton key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center mt-4">
          <FiCompass className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-sm font-semibold text-gray-700">No matching quick actions found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try searching with a different keyword or browse through categories.
          </p>
          {isSearchActive && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset Search
            </button>
          )}
        </div>
      )}

      {/* Show More / Show Less Toggle (for 'All' tab) */}
      {shouldLimit && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
          >
            <span>Show all {filteredActions.length} actions ({filteredActions.length - INITIAL_LIMIT} more)</span>
            <FiChevronDown size={14} />
          </button>
        </div>
      )}

      {!isSearchActive && isAllTab && showAll && filteredActions.length > INITIAL_LIMIT && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <span>Show fewer</span>
            <FiChevronUp size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
