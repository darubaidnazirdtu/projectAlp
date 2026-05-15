import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiGrid, FiUsers, FiBriefcase, FiChevronLeft, FiChevronRight, FiGitBranch, FiDatabase, FiBook, FiTrendingUp, FiShare2, FiFileText, FiHome, FiStar, FiMonitor, FiGlobe, FiUserCheck, FiMapPin, FiDollarSign, FiMousePointer, FiServer, FiHeart, FiShield, FiUserPlus, FiTool, FiList, FiSearch, FiBarChart, FiZap, FiX, FiPlus, FiEye } from 'react-icons/fi';
import { resources } from '../config/tableConfig';
import { canAccessTable } from '../config/rolePermissions.js';
import { ROLES } from '../config/rolePermissions.js';
import { selectRole } from '../store/slices/authSlice.js';

const NavLink = ({ to, icon, label, isCollapsed, matchPaths = [], addPath }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const normalizePath = (path) => {
    if (!path) {
      return null;
    }
    if (path !== '/' && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path;
  };

  const currentPath = normalizePath(location.pathname);
  const candidatePaths = [normalizePath(to), ...matchPaths.map(normalizePath)].filter(Boolean);

  const matchesPath = (path, target) => {
    if (!path || !target) {
      return false;
    }

    if (path === '/app') {
      return target === '/app';
    }
    if (path === '/') {
      return target === '/';
    }
    return target === path || target.startsWith(`${path}/`);
  };

  const isActive = candidatePaths.some((path) => matchesPath(path, currentPath));

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(addPath);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={to}
        className={`flex items-center text-gray-500 transition-all duration-200 ${isActive ? 'text-indigo-600 font-semibold bg-indigo-50' : 'hover:bg-gray-100'
          } ${isCollapsed ? 'justify-center h-12' : `justify-center md:justify-start md:px-4 md:pr-10 ${isHovered ? 'min-h-[3rem] py-2' : 'h-12'}`
          }`}
      >
        <div className={`flex min-w-0 ${isHovered ? 'items-start' : 'items-center'}`}>
          {React.cloneElement(icon, {
            className: `w-6 h-6 shrink-0 ${isHovered ? 'mt-0.5' : ''} ${isCollapsed ? '' : 'md:mr-4'}`,
          })}
          {!isCollapsed && (
            <span className={`hidden md:inline text-md leading-snug ${isHovered ? '' : 'truncate'}`}>{label}</span>
          )}
        </div>
      </Link>
      
      {/* Quick Add button on hover - positioned absolutely */}
      {addPath && !isCollapsed && isHovered && (
        <button
          onClick={handleAddClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-7 h-7 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-150"
          title="Add New"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      )}
      
      {/* Collapsed mode - tooltip with label and add option */}
      {isCollapsed && isHovered && (
        <div className="absolute left-full top-0 ml-2 z-[100] flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 py-2 px-1 min-w-max">
          <span className="text-sm font-semibold text-gray-800 px-3 pb-2 border-b border-gray-100 mb-1">{label}</span>
          <Link
            to={to}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <FiEye className="w-4 h-4" />
            <span>View All</span>
          </Link>
          {addPath && (
            <Link
              to={addPath}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add New</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

const tables = resources
  .map((resource) => {
    const extraMatches = [resource.addPath, resource.editPath].filter(Boolean);
    return {
      id: resource.id,
      to: resource.tablePath,
      addPath: resource.addPath,
      label: resource.title,
      icon: <resource.icon />,
      matchPaths: extraMatches
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

export default function Sidebar() {
  const role = useSelector(selectRole);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const accessibleTables = useMemo(() => {
    if (!role) {
      return [];
    }
    return tables.filter((table) => canAccessTable(role, table.id));
  }, [role]);

  const filteredTables = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return accessibleTables;
    }

    return accessibleTables.filter((table) => table.label.toLowerCase().includes(normalizedQuery));
  }, [accessibleTables, searchTerm]);

  const showNoResults = searchTerm.trim() && filteredTables.length === 0;

  return (
    <div
      className={`flex flex-col bg-white shadow-lg transition-width duration-300 ease-in-out sticky top-0 h-screen z-20 ${isCollapsed ? 'w-20' : 'w-20 md:w-64'
        }`}
    >
      <div
        className={`flex items-center h-20 shrink-0 bg-white border-b ${isCollapsed ? 'justify-center px-1' : 'justify-center md:justify-between px-4'
          }`}
      >
        <Link
          to="/app"
          className={`items-center text-2xl font-bold text-indigo-600 ${isCollapsed ? 'hidden' : 'hidden md:flex'
            }`}
        >
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-16 w-auto mr-3" />
          <span className="text-3xl font-extrabold text-indigo-900 tracking-wider">IQAC</span>
        </Link>

        <Link
          to="/app"
          className={`items-center justify-center ${isCollapsed ? 'flex' : 'flex md:hidden'
            }`}
        >
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-10 w-auto object-contain" />
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-gray-100 hidden md:block"
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <nav className="flex-grow mt-4 overflow-y-auto">
        {!isCollapsed && (
          <div className="hidden md:block px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        )}

        <NavLink to="/app" icon={<FiGrid />} label="Dashboard" isCollapsed={isCollapsed} />
        <NavLink to="/app/reports" icon={<FiFileText />} label="Reports" isCollapsed={isCollapsed} />
        {role === ROLES.IQAC_HEAD && (
          <NavLink to="/app/user-management" icon={<FiUserPlus />} label="User Management" isCollapsed={isCollapsed} />
        )}

        {!isCollapsed && (
          <div className="hidden md:block">
            {accessibleTables.length === 0 && !searchTerm.trim() && (
              <div className="px-4 py-6 text-sm text-gray-500">
                No tables are available for your role.
              </div>
            )}

            {showNoResults && (
              <div className="px-4 py-6 text-sm text-gray-500">
                No tables match "{searchTerm.trim()}".
              </div>
            )}
          </div>
        )}

        {filteredTables.map((table) => (
          <NavLink
            key={table.to}
            to={table.to}
            addPath={table.addPath}
            icon={table.icon}
            label={table.label}
            isCollapsed={isCollapsed}
            matchPaths={table.matchPaths}
          />
        ))}
      </nav>
    </div>
  );
}