import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiSearch, FiUser, FiLogOut, FiPlus, FiX, FiMenu, FiChevronDown, 
  FiCalendar, FiBriefcase, FiGrid, FiFileText, FiLayers, FiExternalLink, 
  FiUsers, FiBarChart2, FiCheck, FiCornerDownLeft
} from 'react-icons/fi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useIqacFilter } from '../context/IqacFilterContext.jsx';
import { DepartmentService } from '../services/department.services.js';
import { resources } from '../config/tableConfig';
import { canAccessForm, canAccessTable, getRoleBadgeColor, ROLE_LABELS, ROLES } from '../config/rolePermissions.js';
import {
  logout as logoutThunk,
  selectRole,
  selectUser
} from '../store/slices/authSlice.js';
import { aparLogout } from '../store/slices/aparAuthSlice.js';
import NotificationBell from './NotificationBell.jsx';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const cleaned = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
};

export default function Header({ setMobileMenuOpen }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const navigate = useNavigate();
  const location = useLocation();

  const { academicYear, departmentId } = useIqacFilter();
  const scopeIsActive = academicYear !== 'All' || departmentId !== 'All';

  // Display user's actual name rather than truncating email
  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || user?.teacherId || '';
  const userDesignation = user?.designation || '';
  const userInitials = getInitials(user?.name || user?.email || 'User');

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const departmentLabel = useMemo(() => {
    if (departmentId === 'All') {
      return 'All';
    }
    return departments.find((department) => department.id === departmentId)?.name || departmentId;
  }, [departmentId, departments]);

  // Unified search catalog covering Tables, Add Forms, and Core Pages
  const searchCatalog = useMemo(() => {
    const items = [];

    // 1. Core Platform Pages
    items.push({
      id: 'page_dashboard',
      label: 'IQAC Statistics Dashboard',
      subtitle: 'Overview & department parameters',
      type: 'page',
      typeLabel: 'Page',
      path: '/app',
      category: 'Overview',
      icon: FiGrid,
      keywords: ['home', 'dashboard', 'stats', 'analytics', 'iqac']
    });

    items.push({
      id: 'page_reports',
      label: 'IQAC Reports & Exports',
      subtitle: 'Generate AQAR & NAAC compliant reports',
      type: 'page',
      typeLabel: 'Page',
      path: '/app/reports',
      category: 'Reports',
      icon: FiFileText,
      keywords: ['report', 'export', 'pdf', 'excel', 'naac', 'aqar']
    });

    if (role === ROLES.IQAC_HEAD) {
      items.push({
        id: 'page_user_mgmt',
        label: 'User Management',
        subtitle: 'Manage administrative & faculty accounts',
        type: 'page',
        typeLabel: 'Page',
        path: '/app/user-management',
        category: 'Administration',
        icon: FiUsers,
        keywords: ['user', 'account', 'faculty', 'role', 'permission']
      });
    }

    items.push({
      id: 'page_feedback',
      label: 'Feedback Analysis',
      subtitle: 'Student and stakeholder feedback insights',
      type: 'page',
      typeLabel: 'Page',
      path: '/feedback-analysis',
      category: 'Analytics',
      icon: FiBarChart2,
      keywords: ['feedback', 'analysis', 'survey', 'stakeholder']
    });

    items.push({
      id: 'page_apar_portal',
      label: 'APAR Portal',
      subtitle: 'Annual Performance Appraisal System',
      type: 'page',
      typeLabel: 'Portal',
      path: '/apar-form',
      category: 'Appraisal',
      icon: FiExternalLink,
      keywords: ['apar', 'appraisal', 'performance', 'evaluation', 'score']
    });

    // 2. Data Tables
    resources.forEach((resource) => {
      if (canAccessTable(role, resource.id)) {
        items.push({
          id: `table_${resource.id}`,
          label: `${resource.title}`,
          subtitle: `View & manage data in ${resource.category || 'records'}`,
          type: 'table',
          typeLabel: 'Table',
          path: resource.tablePath,
          category: resource.category || 'Data',
          icon: resource.icon,
          keywords: resource.keywords || []
        });
      }
    });

    // 3. Quick Entry Forms
    resources.forEach((resource) => {
      if (Boolean(resource.addPath) && canAccessForm(role, resource.id)) {
        items.push({
          id: `form_${resource.id}`,
          label: resource.addLabel || `Add ${resource.title}`,
          subtitle: `Submit entry in ${resource.category || 'records'}`,
          type: 'form',
          typeLabel: 'Add Form',
          path: resource.addPath,
          category: resource.category || 'Forms',
          icon: resource.icon,
          keywords: resource.keywords || []
        });
      }
    });

    return items;
  }, [role]);

  // Filter catalog by user search query
  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return searchCatalog
      .map((item) => {
        const textToSearch = [
          item.label,
          item.subtitle,
          item.path,
          item.category,
          ...(item.keywords || [])
        ].join(' ').toLowerCase();

        let score = 0;
        if (item.label.toLowerCase() === normalizedQuery) score += 100;
        else if (item.label.toLowerCase().startsWith(normalizedQuery)) score += 50;
        else if (item.label.toLowerCase().includes(normalizedQuery)) score += 25;
        else if (textToSearch.includes(normalizedQuery)) score += 10;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [query, searchCatalog]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(0);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchResults.length]);

  // Load department options
  useEffect(() => {
    let cancelled = false;
    const fetchDepartments = async () => {
      try {
        const response = await DepartmentService.getDepartments();
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        if (!cancelled) setDepartments(list);
      } catch {
        if (!cancelled) setDepartments([]);
      }
    };
    fetchDepartments();
    return () => { cancelled = true; };
  }, []);

  // Keyboard shortcut listener: '/' or 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      const isSearchShortcut =
        event.key === '/' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k');

      if (!isSearchShortcut) return;

      const target = event.target;
      if (
        event.key === '/' &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target?.isContentEditable ?? false))
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, []);

  const handleNavigate = (item) => {
    navigate(item.path);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setIsOpen(Boolean(value.trim()));
  };

  const handleKeyDown = (event) => {
    if (!searchResults.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % searchResults.length);
      setIsOpen(true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      setIsOpen(true);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (searchResults[activeIndex]) {
        handleNavigate(searchResults[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(0);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(aparLogout());
      await dispatch(logoutThunk());
    } finally {
      window.location.replace('/login');
    }
  };

  const roleLabel = role ? ROLE_LABELS[role] || role : 'Guest';
  const roleBadgeClass = getRoleBadgeColor(role);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'page':
        return 'bg-purple-50 text-purple-700 border-purple-200/70';
      case 'table':
        return 'bg-sky-50 text-sky-700 border-sky-200/70';
      case 'form':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200/70';
    }
  };

  return (
    <header className="iqac-header flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-[100] transition-all">
      {/* Left Area: Mobile Menu Trigger + Global Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Global Spotlight Search */}
        <div className="relative flex-1 max-w-md xl:max-w-lg" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none transition-colors" />
            <input
              type="text"
              placeholder="Search tables, forms, reports... (Press ⌘K or /)"
              className="w-full h-10 pl-9 pr-14 bg-slate-100/75 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all shadow-2xs"
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onFocus={() => setIsOpen(Boolean(query.trim()))}
              onKeyDown={handleKeyDown}
            />

            {/* Clear or Shortcut badge */}
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex absolute right-2.5 items-center gap-1 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200/90 rounded shadow-2xs">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isOpen && (
            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Search Results
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No matching tables, forms, or pages for "{query.trim()}".
                </div>
              ) : (
                <ul className="max-h-84 overflow-y-auto divide-y divide-slate-100/60 py-1">
                  {searchResults.map((item, index) => {
                    const ItemIcon = item.icon || FiGrid;
                    const isSelected = index === activeIndex;

                    return (
                      <li key={item.id || item.path}>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-50/70 text-indigo-900' : 'hover:bg-slate-50/80 text-slate-700'
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleNavigate(item);
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-slate-100 text-slate-600 border-slate-200/70'
                            }`}>
                              <ItemIcon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {item.subtitle || item.category}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTypeBadge(item.type)}`}>
                              {item.typeLabel}
                            </span>
                            {isSelected && (
                              <FiCornerDownLeft className="text-indigo-600 hidden sm:block" size={13} />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <span>Navigate with <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[10px]">↓</kbd></span>
                <span>Select <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px]">↵</kbd></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Session Badge, Notification Bell & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Active Session & Branch Filter Badge */}
        {scopeIsActive && (
          <Link
            to="/app"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all shadow-2xs"
            title="Active scope on dashboard"
          >
            <FiCalendar className="text-indigo-600" size={13} />
            <span>{academicYear === 'All' ? 'All Years' : academicYear}</span>
            <span className="text-indigo-300">·</span>
            <FiBriefcase className="text-indigo-600" size={13} />
            <span className="max-w-[120px] truncate">{departmentLabel}</span>
          </Link>
        )}

        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative profile-dropdown">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer"
            aria-expanded={profileDropdownOpen}
          >
            {/* User Initials Avatar with Online Badge */}
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            {/* User Identity Details */}
            <div className="hidden sm:block text-left">
              <div className="font-bold text-xs sm:text-sm text-slate-800 leading-tight max-w-[140px] truncate">
                {userName}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${roleBadgeClass} px-1.5 py-0.2 rounded-md leading-normal`}>
                  {roleLabel}
                </span>
              </div>
            </div>

            <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>

          {/* Profile Menu Panel */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{userName}</div>
                    <div className="text-xs text-slate-500 truncate">{userEmail}</div>
                    {userDesignation && (
                      <div className="text-[11px] text-slate-400 truncate">{userDesignation}</div>
                    )}
                    <div className="mt-1.5">
                      <span className={`inline-block text-[10px] font-semibold ${roleBadgeClass} px-2 py-0.5 rounded-full`}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-2 space-y-0.5">
                <Link
                  to="/app"
                  onClick={() => setProfileDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    location.pathname === '/app' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FiGrid className="w-4 h-4 text-slate-400" />
                  <span>IQAC Dashboard</span>
                </Link>

                <Link
                  to="/app/reports"
                  onClick={() => setProfileDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    location.pathname === '/app/reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FiFileText className="w-4 h-4 text-slate-400" />
                  <span>IQAC Reports & Exports</span>
                </Link>

                {role === ROLES.IQAC_HEAD && (
                  <Link
                    to="/app/user-management"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      location.pathname === '/app/user-management' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FiUsers className="w-4 h-4 text-slate-400" />
                    <span>User Management</span>
                  </Link>
                )}

                <Link
                  to="/feedback-analysis"
                  onClick={() => setProfileDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    location.pathname === '/feedback-analysis' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FiBarChart2 className="w-4 h-4 text-slate-400" />
                  <span>Feedback Analysis</span>
                </Link>

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <Link
                    to="/apar-form"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <FiExternalLink className="w-4 h-4 text-slate-400" />
                      <span>Switch to APAR Portal</span>
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Portal
                    </span>
                  </Link>
                </div>
              </div>

              {/* Sign out */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}