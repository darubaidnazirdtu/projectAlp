import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { aparFormReportingService } from '../../services/apar_form_reporting.service.js'
import { aparLogout } from '../../store/slices/aparAuthSlice.js'
import { FiArchive, FiList } from 'react-icons/fi'
import NotificationBell from '../../components/NotificationBell.jsx'
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

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { role } = useSelector(state => state.aparAuth)
  const userRole = role || 'Reporting Officer'

  const { socket } = useSocket()
  const lastRefreshRef = useRef(0)

  const departments = [
    'Applied Chemistry',
    'Applied Mathematics',
    'Applied Physics',
    'Biotechnology',
    'Civil Engineering',
    'Computer Science & Engineering',
    'Delhi School of Management',
    'Electronics & Communication',
    'Electrical Engineering',
    'Environmental Science & Engineering',
    'Geospatial Science & Technology',
    'Humanities',
    'Information Technology',
    'Mechanical Engineering',
    'Design',
    'University School of Management & Entrepreneurship',
    'Software Engineering',
    'Physical Education'
  ];

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

    const matchesDept = selectedDept ? (row.department === selectedDept) : true;

    return matchesSearch && matchesDept;
  });

  /* ... render ... */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* ... Header ... */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 relative">
        <div className="absolute top-0 left-0 -ml-4 -mt-4">
          {/* Logo logic matches existing */}
          <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-24 w-auto object-contain" />
        </div>
        <div className="ml-24">
          <h1 className="text-3xl font-bold text-gray-900">{userRole} Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Manage APAR assessments and reviews</p>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationBell />
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium"
          >
            {logoutLoading ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setViewMode('pending')}
              className={`${viewMode === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FiList className="mr-2" />
              Pending Actions
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`${viewMode === 'archive'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FiArchive className="mr-2" />
              Archive / History
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading data...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {rows.length === 0
              ? (viewMode === 'pending' ? 'No pending actions found.' : 'No archived records found.')
              : 'No matching records found for the selected filters.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map(f => (
                  console.log('Row Data:', f) ||
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.ay}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${f.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                          (f.status === 'Verified' || f.status?.includes('Forwarded')) ? 'bg-purple-100 text-purple-800' :
                            f.status === 'Reviewed' ? 'bg-green-100 text-green-800' :
                              f.status?.includes('Query') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                        {f.status || 'Unknown'}
                      </span>
                      {f.status === 'Query Raised by Reviewing officer' && (
                        <div className="mt-2 relative group inline-block">
                          <button className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-200 transition-colors">
                            View Query
                          </button>
                          {/* Popover */}
                          <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-3 z-50 hidden group-hover:block text-wrap">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Query from Reviewing Officer:</p>
                            <p className="text-xs text-gray-600 italic">"{f.reviewing_query || f.query_comment || 'No details provided'}"</p>
                            <div className="absolute left-4 -bottom-1 w-2 h-2 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
                          </div>
                        </div>
                      )}
                      {/* Show other query comments normally or hidden if redundant */}
                      {(f.status?.includes('Query') && f.status !== 'Query Raised by Reviewing officer' && f.query_comment) && (
                        <div className="mt-1 text-xs text-red-600 bg-red-50 p-1 rounded border border-red-100 italic" title={f.query_comment}>
                          "{f.query_comment.length > 50 ? f.query_comment.substring(0, 50) + '...' : f.query_comment}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {viewMode === 'archive' ? (
                        <button onClick={() => handleReview(f, 'view')} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">View</button>
                      ) : (
                        <>
                          {/* Reporting Officer Actions */}
                          {userRole === 'Reporting Officer' && (f.status === 'Submitted' || f.status === 'Query Raised' || f.status === 'Query Raised by Reviewing officer') && f.status !== 'Query Raised by Reporting officer' && (
                            <button onClick={() => handleReview(f, 'edit')} className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1 rounded-md shadow-sm">Review & Verify</button>
                          )}

                          {/* Reviewing Officer Actions */}
                          {userRole === 'Reviewing Officer' && f.status === 'Forwarded by Reporting officer' && (
                            <button onClick={() => handleReview(f, 'edit')} className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1 rounded-md shadow-sm">Review & Assess</button>
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
        )}
      </div>
    </div >
  )
}
