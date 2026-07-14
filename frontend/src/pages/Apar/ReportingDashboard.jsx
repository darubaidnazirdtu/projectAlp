import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { aparFormReportingService } from '../../services/apar_form_reporting.service.js'
import { DepartmentService } from '../../services/department.services.js'
import { aparLogout } from '../../store/slices/aparAuthSlice.js'
import { FiArchive, FiList, FiSearch, FiFilter, FiInbox, FiLoader, FiEye, FiCheckCircle, FiEdit3, FiMessageCircle } from 'react-icons/fi'
import AparShellHeader from '../../components/AparShellHeader.jsx'
import { useSocket } from '../../context/SocketContext.jsx'

export default function ReportingDashboard() {
  /* ... inside component ... */
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [viewMode, setViewMode] = useState('pending') // 'pending' or 'archive'

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [departments, setDepartments] = useState([])

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { role } = useSelector(state => state.aparAuth)
  const userRole = role || 'Reporting Officer'

  const { socket } = useSocket()
  const lastRefreshRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    const loadDepartments = async () => {
      try {
        const response = await DepartmentService.getDepartments()
        const list = response?.data || response || []
        if (!cancelled) setDepartments(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('failed to load departments', err)
        if (!cancelled) setDepartments([])
      }
    }

    loadDepartments()

    return () => {
      cancelled = true
    }
  }, [])

  const loadRows = useCallback(async () => {
    try {
      setLoading(true)
      let resp;
      const isArchive = viewMode === 'archive'

      if (userRole === 'Reviewing Officer') {
        resp = await aparFormReportingService.getPendingReviews(null, isArchive)
      } else {
        resp = await aparFormReportingService.getAssigned(null, isArchive)
      }

      const data = resp?.rows || resp?.data || resp || []
      const mapped = (data || []).map(r => ({
        id: `${r.faculty_id}-${r.ay}`,
        name: r.name || r.title || r.faculty_id,
        designation: r.designation,
        department: r.dept_name || r.department || r.dept,
        ay: r.ay,
        submissionDate: r.date || null,
        status: r.status || null,
        reviewing_query: r.reviewing_query,
        query_comment: r.query_comment,
        raw: r
      }))
      setRows(mapped)
    } catch (err) {
      console.error('failed to load list', err)
    } finally {
      setLoading(false)
    }
  }, [userRole, viewMode])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  // Real-time refresh for officer dashboards when APAR status changes
  useEffect(() => {
    if (!socket) return

    const shouldRefresh = (n) => {
      const type = (n?.type || '').toString()
      const link = (n?.link || '').toString()
      return type.startsWith('APAR_') || link.includes('/apar')
    }

    const onNotification = async (notification) => {
      if (!shouldRefresh(notification)) return
      const now = Date.now()
      if (now - lastRefreshRef.current < 1000) return
      lastRefreshRef.current = now
      await loadRows()
    }

    socket.on('notification', onNotification)
    return () => socket.off('notification', onNotification)
  }, [socket, loadRows])

  const handleReview = (faculty, action = 'view') => {
    navigate('/apar-form', { state: { selectedFaculty: faculty, action } })
  }

  const handleLogout = async () => {
    try {
      setLogoutLoading(true)
      await dispatch(aparLogout())
      window.location.href = '/apar/login'
    } catch (e) {
      console.error('logout failed', e)
    } finally {
      setLogoutLoading(false)
    }
  }

  // Filtered Rows
  const filteredRows = rows.filter(row => {
    const matchesSearch =
      (row.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const selectedDepartment = departments.find((dept) => (dept.department_id || dept.department_name) === selectedDept)
    const matchesDept = selectedDept
      ? (row.department === selectedDept || row.department === selectedDepartment?.department_name)
      : true;

    return matchesSearch && matchesDept;
  });

  /* ... render ... */
  return (
    <div className="apar-page-bg min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="mx-auto max-w-7xl relative z-10">
        <AparShellHeader
          title={`${userRole} Dashboard`}
          subtitle="Manage APAR assessments and reviews"
          backTo="/"
          actions={
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-xl border border-rose-200/60 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-bold text-rose-600 shadow-[0_2px_10px_rgb(225,29,72,0.06)] transition-all hover:bg-rose-50 hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              {logoutLoading ? 'Logging out…' : 'Logout'}
            </button>
          }
        />
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10 px-0">
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] inline-flex overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              viewMode === 'pending'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <FiList className={viewMode === 'pending' ? 'text-white' : 'text-indigo-500'} />
            Pending Actions
          </button>
          <button
            onClick={() => setViewMode('archive')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              viewMode === 'archive'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50'
            }`}
          >
            <FiArchive className={viewMode === 'archive' ? 'text-white' : 'text-emerald-500'} />
            Archive / History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all duration-300 text-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] placeholder:text-gray-400 font-medium text-sm"
          />
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all duration-300 text-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-medium text-sm appearance-none"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.department_id || dept.department_name} value={dept.department_id || dept.department_name}>
                {dept.department_name || dept.department_id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative z-10 transition-all duration-300">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500">
            <FiLoader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="font-medium text-lg text-gray-700">Loading data...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the records</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FiInbox className="w-10 h-10 text-gray-400" />
            </div>
            <p className="font-semibold text-xl text-gray-700">
              {rows.length === 0
                ? (viewMode === 'pending' ? 'No pending actions found' : 'No archived records found')
                : 'No matching records found'}
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
              {rows.length === 0
                ? 'When new APAR forms require your attention, they will appear here.'
                : 'Try adjusting your search or filters to find what you are looking for.'}
            </p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <div className="data-table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map(f => (
                  <tr key={f.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{f.name}</span>
                        <span className="text-xs font-medium text-gray-500 mt-0.5">{f.designation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/50">
                        {f.ay}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                      {f.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold rounded-xl border
                            ${f.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200/60 shadow-[0_2px_10px_rgb(59,130,246,0.1)]' :
                          (f.status === 'Verified' || f.status?.includes('Forwarded')) ? 'bg-purple-50 text-purple-700 border-purple-200/60 shadow-[0_2px_10px_rgb(168,85,247,0.1)]' :
                            f.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-[0_2px_10px_rgb(16,185,129,0.1)]' :
                              f.status?.includes('Query') ? 'bg-amber-50 text-amber-700 border-amber-200/60 shadow-[0_2px_10px_rgb(245,158,11,0.1)]' :
                                'bg-gray-50 text-gray-700 border-gray-200/60'}`}>
                        {f.status === 'Reviewed' && <FiCheckCircle className="w-3.5 h-3.5" />}
                        {f.status?.includes('Query') && <FiMessageCircle className="w-3.5 h-3.5" />}
                        {f.status || 'Unknown'}
                      </span>
                      {f.status === 'Query Raised by Reviewing officer' && (
                        <div className="mt-2.5 relative group inline-block">
                          <button className="text-[11px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-200/60 shadow-[0_2px_8px_rgb(225,29,72,0.08)] hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center gap-1">
                            <FiEye className="w-3 h-3" /> View Query
                          </button>
                          {/* Popover */}
                          <div className="absolute left-0 bottom-full mb-3 w-72 bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-2xl p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-wrap pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-rose-50 rounded-lg">
                                <FiMessageCircle className="w-3.5 h-3.5 text-rose-500" />
                              </div>
                              <p className="text-xs font-bold text-gray-800">Query from Reviewing Officer</p>
                            </div>
                            <p className="text-[13px] text-gray-600 leading-relaxed italic bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                              "{f.reviewing_query || f.query_comment || 'No details provided'}"
                            </p>
                            <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-white border-b border-r border-gray-200/50 transform rotate-45"></div>
                          </div>
                        </div>
                      )}
                      {/* Show other query comments normally or hidden if redundant */}
                      {(f.status?.includes('Query') && f.status !== 'Query Raised by Reviewing officer' && f.query_comment) && (
                        <div className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50 italic flex items-start gap-1.5 shadow-[0_2px_8px_rgb(245,158,11,0.05)]" title={f.query_comment}>
                          <FiMessageCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {f.query_comment}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {viewMode === 'archive' ? (
                        <button onClick={() => handleReview(f, 'view')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-100 hover:-translate-y-0.5 active:scale-95 transition-all">
                          <FiEye className="w-4 h-4" /> View
                        </button>
                      ) : (
                        <>
                          {/* Reporting Officer Actions */}
                          {userRole === 'Reporting Officer' && (f.status === 'Submitted' || f.status === 'Query Raised' || f.status === 'Query Raised by Reviewing officer') && f.status !== 'Query Raised by Reporting officer' && (
                            <button onClick={() => handleReview(f, 'edit')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
                              <FiEdit3 className="w-4 h-4" /> Review & Verify
                            </button>
                          )}

                          {/* Reviewing Officer Actions */}
                          {userRole === 'Reviewing Officer' && f.status === 'Forwarded by Reporting officer' && (
                            <button onClick={() => handleReview(f, 'edit')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
                              <FiEdit3 className="w-4 h-4" /> Review & Assess
                            </button>
                          )}

                          {/* Fallback View
                          {(!['Submitted', 'Query Raised', 'Forwarded by Reporting officer'].includes(f.status)) && (
                            <button onClick={() => handleReview(f, 'view')} className="text-gray-600 hover:text-gray-900">View Status</button>
                          )} */}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
