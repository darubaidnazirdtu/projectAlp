import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiUser, FiLogOut, FiPlus, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
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

export default function Header() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const navigate = useNavigate();
  const teacherId = user?.teacherId || null;
  const email = user?.email || null;
  const displayName = email || teacherId || 'Guest';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

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
    setActiveIndex(0);
  }, [filteredRoutes.length]);

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
    // Keep UX simple: attempt cleanup, then go back to login.
    try {
      await dispatch(aparLogout());
      await dispatch(logoutThunk());
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const roleLabel = role ? ROLE_LABELS[role] || role : 'Guest';
  const roleBadgeClass = getRoleBadgeColor(role);

  return (
    <header className="flex items-center justify-between h-20 shrink-0 px-8 bg-white border-b sticky top-0 z-[100]">
      <div className="relative" ref={searchContainerRef}>
        <FiSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-96 h-12 pl-12 pr-10 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FiX />
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
      <div className="flex items-center space-x-6">
        <NotificationBell />
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <FiUser className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <div className="font-semibold">{displayName}</div>
            <div className="text-sm text-gray-500">
              {email && teacherId
                ? `Teacher ID: ${teacherId}`
                : email || (teacherId ? `Teacher ID: ${teacherId}` : 'Not signed in')}
            </div>
            <div className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass}`}>
              {roleLabel}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-full transition hover:bg-indigo-50"
        >
          <FiLogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}