import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiUser, FiLogOut, FiPlus, FiX, FiMenu, FiChevronDown } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useIqacFilter } from '../context/IqacFilterContext.jsx';
import { DepartmentService } from '../services/department.services.js';
import { formRoutes } from '../utils/addFormRoutes.js';
import { canAccessForm, getRoleBadgeColor } from '../config/rolePermissions.js';
import { ROLE_LABELS } from '../config/rolePermissions.js';
import {
  logout as logoutThunk,
  selectRole,
  selectUser
} from '../store/slices/authSlice.js';
import { aparLogout } from '../store/slices/aparAuthSlice.js';
import NotificationBell from './NotificationBell.jsx';

export default function Header({ setMobileMenuOpen }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const navigate = useNavigate();
  const { academicYear, departmentId } = useIqacFilter();
  const scopeIsActive = academicYear !== 'All' || departmentId !== 'All';
  const teacherId = user?.teacherId || null;
  const email = user?.email || null;
  const displayName = email || teacherId || 'Guest';
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

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return formRoutes
      .filter((item) => canAccessForm(role, item.id))
      .map((item) => {
        const searchText = [
          item.label,
          item.path,
          ...(item.keywords || []),
          item.category
        ]
          .join(' ')
          .toLowerCase();

        const score = searchText.includes(normalizedQuery) ? 1 : 0;
        const startsWith = item.label.toLowerCase().startsWith(normalizedQuery) ? 1 : 0;

        return {
          ...item,
          score,
          startsWith
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.startsWith - a.startsWith !== 0) {
          return b.startsWith - a.startsWith;
        }
        if (b.score - a.score !== 0) {
          return b.score - a.score;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 8);
  }, [query, role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredRoutes.length]);

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

        if (!cancelled) {
          setDepartments(list);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
        }
      }
    };

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target?.isContentEditable ?? false)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcut);
    };
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
    if (!filteredRoutes.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredRoutes.length);
      setIsOpen(true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredRoutes.length) % filteredRoutes.length);
      setIsOpen(true);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleNavigate(filteredRoutes[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(0);
    }
  };

  // ... 

  const handleLogout = async () => {
    // Keep UX simple: attempt cleanup, then do a full navigation back to login
    // Use a full-page replace to avoid leaving stale SPA state / CSRF tokens.
    try {
      await dispatch(aparLogout());
      await dispatch(logoutThunk());
    } finally {
      window.location.replace('/login');
    }
  };

  const roleLabel = role ? ROLE_LABELS[role] || role : 'Guest';
  const roleBadgeClass = getRoleBadgeColor(role);

  return (
    <header className="iqac-header flex h-16 sm:h-20 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-[100]">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <FiMenu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Search - responsive width */}
      <div className="relative flex-1 max-w-md lg:max-w-none mx-2 lg:mx-0" ref={searchContainerRef}>
        <FiSearch className="absolute top-1/2 left-3 sm:left-4 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-8 sm:pr-10 bg-gray-50/50 border border-gray-200/60 rounded-full focus:bg-white shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm"
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(Boolean(query.trim()))}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
        {isOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Add forms
            </div>
            {filteredRoutes.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No forms found for "{query.trim()}".
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {filteredRoutes.map((item, index) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${index === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleNavigate(item);
                      }}
                    >
                      <span className={`mt-1 rounded-full border p-2 ${index === activeIndex ? 'border-indigo-300 bg-white text-indigo-600' : 'border-gray-200 bg-gray-100 text-gray-500'}`}>
                        <FiPlus className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                        <span className="text-xs uppercase tracking-wide text-indigo-500">{item.category}</span>
                        <span className="text-xs text-gray-400">{item.path}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-4 py-2 text-xs text-gray-400 border-t bg-gray-50">
              Tip: Press / to focus, Enter to open the highlighted form.
            </div>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {scopeIsActive && (
          <Link
            to="/app"
            className="hidden xl:inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            title="Change filters on Dashboard"
          >
            Session: {academicYear === 'All' ? 'All Years' : academicYear}
            {' · '}
            Branch: {departmentLabel}
          </Link>
        )}
        <NotificationBell />
        
        {/* Profile section - responsive */}
        <div className="relative profile-dropdown">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2 sm:space-x-3 p-1.5 rounded-xl hover:bg-indigo-50/50 transition-all duration-300 border border-transparent hover:border-indigo-100 hover:shadow-sm"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md ring-2 ring-white">
              <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-semibold text-sm text-gray-900 truncate max-w-[120px]">{displayName}</div>
              <div className={`text-xs font-medium ${roleBadgeClass} inline-block px-2 py-0.5 rounded-full`}>
                {roleLabel}
              </div>
            </div>
            <FiChevronDown className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{displayName}</div>
                    <div className="text-xs text-gray-500 truncate">{email || teacherId || 'Guest'}</div>
                    <div className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass}`}>
                      {roleLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {scopeIsActive && (
                  <Link
                    to="/app"
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-xs text-gray-500">
                      Session: {academicYear === 'All' ? 'All Years' : academicYear}
                    </span>
                    <span className="mx-2 text-gray-300">·</span>
                    <span className="text-xs text-gray-500">
                      Branch: {departmentLabel}
                    </span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}