import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArchive, FiCheckCircle, FiClock, FiLoader, FiSearch, FiUsers, FiX, FiEye } from 'react-icons/fi';
import { aparFormReportingService } from '../../services/apar_form_reporting.service.js';
import { aparLogout } from '../../store/slices/aparAuthSlice.js';
import { DepartmentService } from '../../services/department.services.js';
import AparShellHeader from '../../components/AparShellHeader.jsx';

const normalizeAY = (value) => String(value || '').replace(/\s+/g, '').replace(/\//g, '-').trim();

const getCurrentAcademicYear = () => {
  const start = new Date().getFullYear();
  return `${start}-${String(start + 1).slice(-2)}`;
};

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'not filled') return 'bg-red-100 text-red-800';
  if (normalized === 'draft') return 'bg-gray-100 text-gray-800';
  if (normalized.includes('query')) return 'bg-yellow-100 text-yellow-800';
  if (normalized.includes('accepted') || normalized.includes('review')) return 'bg-green-100 text-green-800';
  if (normalized.includes('forwarded')) return 'bg-purple-100 text-purple-800';
  if (normalized.includes('submitted')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export default function DeanDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.aparAuth);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalFaculty: 0, submittedCount: 0, notSubmittedCount: 0 });
  const [currentAY, setCurrentAY] = useState(getCurrentAcademicYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyHistory, setFacultyHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => {
      const start = currentYear - index;
      return `${start}-${String(start + 1).slice(-2)}`;
    });
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await DepartmentService.getDepartmentList();
      console.log('Departments response:', response);
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('failed to load departments', err);
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const departmentId = selectedDepartment === 'all' ? undefined : selectedDepartment;
      const response = await aparFormReportingService.getDeanStatus(normalizeAY(currentAY), departmentId);
      setRows(Array.isArray(response?.rows) ? response.rows : []);
      setSummary({
        totalFaculty: response?.totalFaculty || 0,
        submittedCount: response?.submittedCount || 0,
        notSubmittedCount: response?.notSubmittedCount || 0
      });
    } catch (err) {
      console.error('failed to load dean apar status', err);
      setError(err?.response?.data?.message || 'Failed to load APAR status');
      setRows([]);
      setSummary({ totalFaculty: 0, submittedCount: 0, notSubmittedCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentAY, selectedDepartment]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [
      row.name,
      row.faculty_id,
      row.email,
      row.designation,
      row.status
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [rows, searchTerm]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await dispatch(aparLogout());
      window.location.href = '/apar/login';
    } finally {
      setLogoutLoading(false);
    }
  };

  const loadFacultyHistory = useCallback(async (facultyId, ay) => {
    setHistoryLoading(true);
    try {
      const response = await aparFormReportingService.getFacultyHistoryByDean(facultyId, ay);
      setFacultyHistory(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('failed to load faculty history', err);
      setFacultyHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleStatusClick = useCallback(async (row) => {
    setSelectedFaculty(row);
    setStatusModalOpen(true);
    await loadFacultyHistory(row.faculty_id, row.ay);
  }, [loadFacultyHistory]);

  const handleViewForm = useCallback((row) => {
    navigate('/apar-form', { state: { selectedFaculty: { ...row, raw: row }, action: 'view' } });
  }, [navigate]);

  return (
    <div className="apar-page-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AparShellHeader
          title="Dean APAR Dashboard"
          subtitle="Track APAR submission status for faculty in your mapped department"
          backTo="/"
          actions={
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
            >
              {logoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <FiUsers className="text-emerald-600" />
              Faculty
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">{summary.totalFaculty}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <FiCheckCircle className="text-green-600" />
              Submitted
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">{summary.submittedCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <FiClock className="text-red-600" />
              Not Submitted
            </div>
            <div className="mt-3 text-3xl font-bold text-gray-900">{summary.notSubmittedCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <FiArchive className="text-indigo-600" />
              Academic Year
            </div>
            <select
              value={currentAY}
              onChange={(event) => setCurrentAY(event.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
          <select
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search faculty, ID, email, or status..."
              className="form-field-input-iqac w-full pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-gray-500">
              <FiLoader className="h-5 w-5 animate-spin text-emerald-600" />
              Loading APAR status...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {rows.length === 0 ? 'No faculty records found for your mapped department.' : 'No matching faculty records found.'}
            </div>
          ) : (
            <div className="data-table-wrapper">
              <div className="data-table-scroll">
                <table className="data-table data-table-apar text-left">
                  <thead>
                    <tr>
                      <th className="!text-left">Faculty</th>
                      <th className="!text-left">Designation</th>
                      <th className="!text-left">Submitted</th>
                      <th className="!text-left">APAR Status</th>
                      <th className="!text-left">Last Updated</th>
                      <th className="!text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.faculty_id}>
                        <td className="!text-left">
                          <div className="font-semibold text-gray-900">{row.name}</div>
                          <div className="text-xs text-gray-500">{row.faculty_id}</div>
                          {row.email && <div className="text-xs text-gray-400">{row.email}</div>}
                        </td>
                        <td className="!text-left text-sm text-gray-600">{row.designation || '-'}</td>
                        <td className="!text-left">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {row.hasSubmitted ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="!text-left">
                          <button
                            onClick={() => handleStatusClick(row)}
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(row.status)}`}
                          >
                            {row.status || 'Unknown'}
                          </button>
                        </td>
                        <td className="!text-left text-sm text-gray-500">{formatDate(row.updatedAt || row.submittedAt)}</td>
                        <td className="!text-left">
                          <button
                            onClick={() => handleViewForm(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-95 cursor-pointer disabled:opacity-60"
                            disabled={row.status === 'Not Filled' || row.status === 'not_filled'}
                            title={row.status === 'Not Filled' || row.status === 'not_filled' ? 'Form has not been created yet' : 'View Faculty APAR Form'}
                          >
                            <FiEye className="h-3.5 w-3.5" /> View Form
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {user?.departmentId && (
          <p className="mt-4 text-xs text-gray-500">Mapped department/faculty: {user.departmentId}</p>
        )}

        {/* Status Timeline Modal */}
        {statusModalOpen && selectedFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  APAR Status Timeline - {selectedFaculty.name}
                </h3>
                <button
                  onClick={() => {
                    setStatusModalOpen(false);
                    setSelectedFaculty(null);
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faculty ID:</span>
                    <span className="font-medium text-gray-900">{selectedFaculty.faculty_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedFaculty.status)}`}>
                      {selectedFaculty.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium text-gray-900">{selectedFaculty.ay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedFaculty.updatedAt || selectedFaculty.submittedAt)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Status History</h4>
                  {historyLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Loading history...
                    </div>
                  ) : facultyHistory && facultyHistory.length > 0 ? (
                    <div className="space-y-3">
                      {facultyHistory.map((historyItem, index) => (
                        <div key={index} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                          <div className={`mt-1 h-2 w-2 rounded-full ${
                            historyItem.status.includes('accepted') || historyItem.status.includes('review') ? 'bg-green-500' :
                            historyItem.status.includes('query') ? 'bg-yellow-500' :
                            historyItem.status.includes('submitted') ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{historyItem.status}</div>
                            <div className="text-xs text-gray-500">
                              Academic Year: {historyItem.ay} | Updated: {formatDate(historyItem.updatedAt)}
                            </div>
                            {historyItem.timeline && (
                              <div className="mt-2 text-xs text-gray-600">
                                {historyItem.timeline.submitted_at && (
                                  <div>Submitted: {formatDate(historyItem.timeline.submitted_at)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No history available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
