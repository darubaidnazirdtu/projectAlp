import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiEye, FiEyeOff, FiRefreshCw, FiShield, FiUserPlus, FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import AccessDenied from '../components/AccessDenied.jsx';
import { selectInitializeStatus, selectRole } from '../store/slices/authSlice.js';
import { ROLES } from '../config/rolePermissions.js';
import { userManagementService } from '../services/user_management.service.js';
import { DepartmentService } from '../services/department.services.js';
import { validatePasswordPolicy } from '../utils/passwordPolicy.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPLOYEE_ID_REGEX = /^[a-zA-Z0-9]+$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/;

const ROLE_OPTIONS = [ROLES.IQAC_HEAD, ROLES.DEAN, ROLES.DEPARTMENT_HOD, ROLES.FACULTY];
const APAR_ROLE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Dean', label: 'Dean' },
  { value: 'Reporting Officer', label: 'Reporting Officer' },
  { value: 'Reviewing Officer', label: 'Reviewing Officer' }
];
const YES_NO_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' }
];
const DESIGNATION_OPTIONS = [
  { value: '', label: 'Select designation', disabled: true },
  { value: 'Professor', label: 'Professor' },
  { value: 'Associate Professor', label: 'Associate Professor' },
  { value: 'Assistant Professor', label: 'Assistant Professor' }
];

const emptyCreateForm = {
  userId: null,
  name: null,
  email: null,
  designation: null,
  role: null,
  password: null,
  departmentId: null,
  isReportingOfficer: 'no',
  isReviewingOfficer: 'no'
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

export default function UserManagement() {
  const role = useSelector(selectRole);
  const initializeStatus = useSelector(selectInitializeStatus);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [drafts, setDrafts] = useState({});
  const [createPasswordVisible, setCreatePasswordVisible] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({});

  const isIqacHead = role === ROLES.IQAC_HEAD;

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      return [user.name, user.userId, user.email, user.role, user.designation, user.departmentId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [searchTerm, users]);

  useEffect(() => {
    if (!isIqacHead) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          userManagementService.listUsers(),
          DepartmentService.getDepartments()
        ]);

        if (cancelled) {
          return;
        }

        const fetchedUsers = Array.isArray(usersResponse?.users) ? usersResponse.users : [];
        const fetchedDepartments = Array.isArray(departmentsResponse) ? departmentsResponse : [];

        setUsers(fetchedUsers);
        setDepartments(fetchedDepartments);
        setDrafts(
          Object.fromEntries(
            fetchedUsers.map((user) => [user.id, {
              role: user.role,
              email: user.email || '',
              departmentId: user.departmentId || '',
              password: '',
              aparRole: user.aparRole || ''
            }])
          )
        );
      } catch (error) {
        console.error('Failed to load user management data', error);
        toast.error(error?.response?.data?.message || 'Failed to load user management data');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isIqacHead]);

  const refreshData = async () => {
    const usersResponse = await userManagementService.listUsers();

    const fetchedUsers = Array.isArray(usersResponse?.users) ? usersResponse.users : [];

    setUsers(fetchedUsers);
    setDrafts(
      Object.fromEntries(
        fetchedUsers.map((user) => [user.id, {
          role: user.role,
          email: user.email || '',
          departmentId: user.departmentId || '',
          password: '',
          aparRole: user.aparRole || ''
        }])
      )
    );
  };

  const togglePasswordVisibility = (userId) => {
    setPasswordVisibility((current) => ({
      ...current,
      [userId]: !current[userId]
    }));
  };

  const handleCreateRoleChange = (value) => {
    setCreateForm((current) => ({
      ...current,
      role: value,
      ...(value === ROLES.DEAN
        ? { isReportingOfficer: 'no', isReviewingOfficer: 'no' }
        : {})
    }));
  };

  const handleCreateFlagChange = (field, value) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'isReportingOfficer' && value === 'yes' ? { isReviewingOfficer: 'no' } : {}),
      ...(field === 'isReviewingOfficer' && value === 'yes' ? { isReportingOfficer: 'no' } : {})
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const trimmedUserId = createForm.userId?.trim();
    if (!trimmedUserId) {
      toast.error('Employee ID is required');
      return;
    }

    if (trimmedUserId.length < 5) {
      toast.error('Employee ID must be at least 5 characters');
      return;
    }

    if (!EMPLOYEE_ID_REGEX.test(trimmedUserId)) {
      toast.error('Employee ID can only contain letters and numbers (no special characters)');
      return;
    }

    if (!createForm.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!NAME_REGEX.test(createForm.name.trim())) {
      toast.error('Name can only contain letters and spaces (no special characters)');
      return;
    }

    const normalizedEmail = createForm.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Email is required');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password policy validation bypassed for auto-generated passwords

    if (!createForm.role) {
      toast.error('Role is required');
      return;
    }

    if (!createForm.departmentId?.trim()) {
      toast.error('Department is required');
      return;
    }

    setSaving(true);
    try {
      const finalPassword = createForm.password?.trim() || trimmedUserId.substring(0, 5).toLowerCase() + '@888';
      await userManagementService.createUser({
        userId: trimmedUserId,
        name: createForm.name.trim(),
        email: normalizedEmail,
        designation: createForm.designation?.trim() || null,
        role: createForm.role,
        password: finalPassword,
        departmentId: createForm.departmentId.trim(),
        isReportingOfficer: createForm.isReportingOfficer === 'yes',
        isReviewingOfficer: createForm.isReviewingOfficer === 'yes'
      });
      toast.success(`User created successfully. Password: ${finalPassword}`);
      setCreateForm(emptyCreateForm);
      await refreshData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDraftChange = (userId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] || {}),
        [field]: value,
        ...(field === 'role' && value === ROLES.DEAN ? { aparRole: 'Dean' } : {})
      }
    }));
  };

  const handleSaveUser = async (user) => {
    const draft = drafts[user.id] || {};
    const password = draft.password?.trim() || '';

    if (password) {
      const passwordError = validatePasswordPolicy(password);
      if (passwordError) {
        toast.error(passwordError);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        role: draft.role ?? user.role,
        email: draft.email?.trim() || user.email,
        departmentId: draft.departmentId === undefined ? user.departmentId : (draft.departmentId || null),
        aparRole: draft.aparRole || null
      };

      if (password) {
        payload.password = password;
      }

      await userManagementService.updateUser(user.id, payload);
      toast.success('User updated successfully');
      await refreshData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.name || user.userId}"?`)) {
      return;
    }

    setSaving(true);
    try {
      await userManagementService.deleteUser(user.id);
      toast.success('User deleted successfully');
      await refreshData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete user');
    } finally {
      setSaving(false);
    }
  };

  if (initializeStatus === 'loading' || (loading && isIqacHead)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm font-medium text-gray-500">Loading user management…</span>
      </div>
    );
  }

  if (!isIqacHead) {
    return <AccessDenied message="Only IQAC Head accounts can add users or change privileges." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            <FiShield className="h-4 w-4" />
            IQAC Head controls
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Add new user accounts for faculty members and update the privileges, email, department, and password of existing users from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw className={saving ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <FiUsers className="text-indigo-600" />
            Active accounts
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{users.length}</div>
        </div>
        {/* <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <FiUserPlus className="text-emerald-600" />
            Manual creation
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">On</div>
        </div> */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <FiShield className="text-violet-600" />
            Roles available
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{ROLE_OPTIONS.length}</div>
        </div>
      </div>

      <div className="grid gap-8">
        <form onSubmit={handleCreate} className="form-card">
          <div className="form-card-body">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <FiUserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add new user</h2>
              <p className="text-sm text-gray-500">Create a new account directly, then assign the appropriate role and privileges.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Employee ID</span>
                <input
                  type="text"
                  value={createForm.userId || ''}
                  onChange={(event) => setCreateForm((current) => ({ ...current, userId: event.target.value }))}
                  className="form-field-input-iqac"
                  placeholder="e.g. FAC001 or U1001"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Name</span>
                <input
                  type="text"
                  value={createForm.name || ''}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  className="form-field-input-iqac"
                  placeholder="Full name"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={createForm.email || ''}
                  onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                  className="form-field-input-iqac"
                  placeholder="user@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Designation</span>
                <select
                  value={createForm.designation || ''}
                  onChange={(event) => setCreateForm((current) => ({ ...current, designation: event.target.value }))}
                  required
                  className="form-field-input-iqac"
                >
                  {DESIGNATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Role</span>
                <select
                  value={createForm.role || ''}
                  onChange={(event) => handleCreateRoleChange(event.target.value)}
                  required
                  className="form-field-input-iqac"
                >
                  <option value="" disabled>Select role</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Department</span>
                <select
                  value={createForm.departmentId || ''}
                  onChange={(event) => setCreateForm((current) => ({ ...current, departmentId: event.target.value }))}
                  required
                  className="form-field-input-iqac"
                >
                  <option value="" disabled>Select department</option>
                  {departments.map((department) => (
                    <option
                      key={department.department_id || department.department_name}
                      value={department.department_id || ''}
                    >
                      {department.department_name || department.department_id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Temporary password</span>
                <p className="mb-2 text-xs text-gray-500">Auto-generated: first 5 letters of Employee ID + @888</p>
                <div className="relative">
                  <input
                    type={createPasswordVisible ? 'text' : 'password'}
                    value={createForm.password || ''}
                    onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                    disabled
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 pr-12 text-sm text-gray-500 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setCreatePasswordVisible((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 transition hover:text-gray-700"
                    aria-label={createPasswordVisible ? 'Hide create password' : 'Show create password'}
                  >
                    {createPasswordVisible ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Is Reporting Officer</span>
                <select
                  value={createForm.isReportingOfficer}
                  onChange={(event) => handleCreateFlagChange('isReportingOfficer', event.target.value)}
                  className="form-field-input-iqac"
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Is Reviewing Officer</span>
                <select
                  value={createForm.isReviewingOfficer}
                  onChange={(event) => handleCreateFlagChange('isReviewingOfficer', event.target.value)}
                  className="form-field-input-iqac"
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

          </div>
          </div>
          <div className="form-card-footer -mx-6 -mb-6 sm:-mx-8 sm:-mb-8">
            <button type="submit" disabled={saving} className="form-btn-primary w-full justify-center sm:w-auto">
              <FiUserPlus />
              Create user
            </button>
          </div>
        </form>

        <div className="form-card">
          <div className="form-card-body">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Existing users</h2>
              <p className="text-sm text-gray-500">Update the role or email of a user and save the changes instantly.</p>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search users..."
              className="form-field-input-iqac md:max-w-xs"
            />
          </div>

          <div className="data-table-wrapper mt-6">
            <div className="data-table-scroll">
            <table className="data-table text-left">
              <thead>
                <tr>
                  <th className="!text-left">User</th>
                  <th className="!text-left">Email</th>
                  <th className="!text-left">Role</th>
                  <th className="!text-left">APAR Role</th>
                  <th className="!text-left">Department</th>
                  <th className="!text-left">Password</th>
                  <th className="!text-left">Created</th>
                  <th className="!text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const draft = drafts[user.id] || {
                    role: user.role,
                    email: user.email || '',
                    departmentId: user.departmentId || '',
                    password: '',
                    aparRole: user.aparRole || ''
                  };
                  const isPasswordVisible = !!passwordVisibility[user.id];

                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-3 py-4">
                        <div className="font-semibold text-gray-900">{user.name || user.userId}</div>
                        <div className="text-xs text-gray-500">{user.userId}</div>
                        <div className="text-xs text-gray-400">{user.designation || 'No designation'}</div>
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="email"
                          value={draft.email || ''}
                          onChange={(event) => handleDraftChange(user.id, 'email', event.target.value)}
                          className="w-full min-w-[220px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={draft.role || user.role}
                          onChange={(event) => handleDraftChange(user.id, 'role', event.target.value)}
                          className="w-full min-w-[180px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={draft.aparRole}
                          onChange={(event) => handleDraftChange(user.id, 'aparRole', event.target.value)}
                          className="w-full min-w-[150px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none"
                        >
                          {APAR_ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="text"
                          value={draft.departmentId || ''}
                          onChange={(event) => handleDraftChange(user.id, 'departmentId', event.target.value)}
                          className="w-full min-w-[130px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="relative min-w-[220px]">
                          <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={draft.password || ''}
                            onChange={(event) => handleDraftChange(user.id, 'password', event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-11 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="Update password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-gray-700"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveUser(user)}
                            disabled={saving}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save
                          </button>
                          {(Object.keys(drafts[user.id] || {}).length > 0 || !user.aparRole) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              disabled={saving}
                              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td className="data-table-empty text-sm text-gray-500" colSpan={8}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
