import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiEye, FiEyeOff, FiRefreshCw, FiShield, FiUserPlus, FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import AccessDenied from '../components/AccessDenied.jsx';
import { selectInitializeStatus, selectRole } from '../store/slices/authSlice.js';
import { ROLES } from '../config/rolePermissions.js';
import { userManagementService } from '../services/user_management.service.js';

const ROLE_OPTIONS = [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD, ROLES.FACULTY];

const emptyCreateForm = {
  userId: '',
  name: '',
  email: '',
  designation: '',
  role: ROLES.FACULTY,
  password: '12345',
  departmentId: ''
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
        const usersResponse = await userManagementService.listUsers();

        if (cancelled) {
          return;
        }

        const fetchedUsers = Array.isArray(usersResponse?.users) ? usersResponse.users : [];

        setUsers(fetchedUsers);
        setDrafts(
          Object.fromEntries(
            fetchedUsers.map((user) => [user.id, {
              role: user.role,
              email: user.email || '',
              departmentId: user.departmentId || '',
              password: ''
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
          password: ''
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

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!createForm.userId) {
      toast.error('User ID is required');
      return;
    }

    if (!createForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!createForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      await userManagementService.createUser({
        userId: createForm.userId,
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        designation: createForm.designation.trim(),
        role: createForm.role,
        password: createForm.password,
        departmentId: createForm.departmentId || null
      });
      toast.success('User created successfully');
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
        [field]: value
      }
    }));
  };

  const handleSaveUser = async (user) => {
    const draft = drafts[user.id] || {};
    const password = draft.password?.trim() || '';

    if (password && password.length < 5) {
      toast.error('Password must be at least 5 characters long');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: draft.role ?? user.role,
        email: draft.email?.trim() || user.email,
        departmentId: draft.departmentId === undefined ? user.departmentId : (draft.departmentId || null)
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

  if (initializeStatus === 'loading' || (loading && isIqacHead)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm font-medium text-gray-500">Loading user management…</span>
      </div>
    );
  }

  if (!isIqacHead) {
    return <AccessDenied message="Only the IQAC Head can add users or change privileges." />;
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

      <div className="grid gap-8 xl:grid-cols-[1.05fr_1.4fr]">
        <form onSubmit={handleCreate} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
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
                <span className="mb-2 block text-sm font-medium text-gray-700">User ID</span>
                <input
                  type="text"
                  value={createForm.userId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, userId: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. FAC001 or U1001"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Name</span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Full name"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="user@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Designation</span>
                <input
                  type="text"
                  value={createForm.designation}
                  onChange={(event) => setCreateForm((current) => ({ ...current, designation: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Role</span>
                <select
                  value={createForm.role}
                  onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="mb-2 mt-4 block text-sm font-medium text-gray-700">Department</span>
                <input
                  type="text"
                  value={createForm.departmentId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, departmentId: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Optional"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Temporary password</span>
                <div className="relative">
                  <input
                    type={createPasswordVisible ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
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

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiUserPlus />
              Create user
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
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
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 md:max-w-xs"
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Password</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  const draft = drafts[user.id] || {
                    role: user.role,
                    email: user.email || '',
                    departmentId: user.departmentId || '',
                    password: ''
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
                        <button
                          type="button"
                          onClick={() => handleSaveUser(user)}
                          disabled={saving}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-sm text-gray-500" colSpan={7}>
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
  );
}