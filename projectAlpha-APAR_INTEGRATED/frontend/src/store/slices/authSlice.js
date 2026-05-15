import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service.js';
import { ROLES } from '../../config/rolePermissions.js';

const extractErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return fallback;
};

const getAllowedRolesFor = (role) => {
  if (!role) {
    return [];
  }

  const normalized = role.trim().toLowerCase();

  if (normalized === ROLES.IQAC_HEAD.toLowerCase()) {
    return [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD, ROLES.FACULTY];
  }

  if (normalized === ROLES.DEPARTMENT_HOD.toLowerCase()) {
    return [ROLES.DEPARTMENT_HOD, ROLES.FACULTY];
  }

  if (normalized === ROLES.FACULTY.toLowerCase()) {
    return [ROLES.FACULTY];
  }

  return [role];
};

const initialState = {
  user: null,
  baseRole: null,
  role: null,
  allowedRoles: [],
  lastVerifiedRole: null,
  status: 'idle',
  initializeStatus: 'idle',
  verifyStatus: 'idle',
  error: null,
  verifyError: null
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }, thunkAPI) => {
    try {
      const response = await authService.login(email, password, role);
      localStorage.setItem('auth_session', 'true');
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to sign in'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await authService.logout();
    localStorage.removeItem('auth_session');
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to sign out'));
  }
});

export const initializeSession = createAsyncThunk(
  'auth/initializeSession',
  async (_, thunkAPI) => {
    if (!localStorage.getItem('auth_session')) {
      return null;
    }
    try {
      const response = await authService.getProfile();
      return response.user;
    } catch (error) {
      localStorage.removeItem('auth_session');
      if (error.response?.status === 401) {
        return null;
      }
      return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to load session'));
    }
  }
);

export const verifyRole = createAsyncThunk(
  'auth/verifyRole',
  async (role, thunkAPI) => {
    try {
      const response = await authService.verifyRole(role);
      return response.role;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Role verification failed'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRoleLocally(state, action) {
      state.role = action.payload ?? null;
    },
    resetAuthState() {
      return { ...initialState, initializeStatus: 'succeeded' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.initializeStatus = 'succeeded';
        state.user = action.payload?.user ?? null;
        state.baseRole = action.payload?.user?.role ?? null;
        state.role = action.payload?.activeRole ?? action.payload?.user?.role ?? null;
        state.allowedRoles = Array.isArray(action.payload?.allowedRoles) && action.payload.allowedRoles.length
          ? action.payload.allowedRoles
          : getAllowedRolesFor(action.payload?.user?.role);
        state.lastVerifiedRole = action.payload?.user?.role ?? null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to sign in';
        state.user = null;
        state.baseRole = null;
        state.role = null;
        state.allowedRoles = [];
        state.lastVerifiedRole = null;
      })
      .addCase(logout.fulfilled, () => {
        return { ...initialState, initializeStatus: 'succeeded' };
      })
      .addCase(initializeSession.pending, (state) => {
        state.initializeStatus = 'loading';
        state.error = null;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.initializeStatus = 'succeeded';
        state.error = null;
        state.user = action.payload;
        state.baseRole = action.payload?.role ?? null;
        state.role = action.payload?.role ?? null;
        state.allowedRoles = getAllowedRolesFor(action.payload?.role);
        state.lastVerifiedRole = action.payload?.role ?? null;
      })
      .addCase(initializeSession.rejected, (state, action) => {
        state.initializeStatus = 'failed';
        state.error = action.payload || 'Unable to load session';
        state.user = null;
        state.baseRole = null;
        state.role = null;
        state.allowedRoles = [];
        state.lastVerifiedRole = null;
      })
      .addCase(verifyRole.pending, (state) => {
        state.verifyStatus = 'loading';
        state.verifyError = null;
      })
      .addCase(verifyRole.fulfilled, (state, action) => {
        state.verifyStatus = 'succeeded';
        state.verifyError = null;
        state.lastVerifiedRole = action.payload;
        state.baseRole = action.payload;
        state.allowedRoles = getAllowedRolesFor(action.payload);
        if (state.user) {
          state.user = { ...state.user, role: action.payload };
        }
      })
      .addCase(verifyRole.rejected, (state, action) => {
        state.verifyStatus = 'failed';
        state.verifyError = action.payload || 'Role verification failed';
        if (state.lastVerifiedRole) {
          state.baseRole = state.lastVerifiedRole;
          state.allowedRoles = getAllowedRolesFor(state.lastVerifiedRole);
          if (state.user) {
            state.user = { ...state.user, role: state.lastVerifiedRole };
          }
          state.role = state.lastVerifiedRole;
        }
      });
  }
});

export const { setRoleLocally, resetAuthState } = authSlice.actions;

export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectBaseRole = (state) => state.auth.baseRole;
export const selectAllowedRoles = (state) => state.auth.allowedRoles;
export const selectAuthStatus = (state) => state.auth.status;
export const selectInitializeStatus = (state) => state.auth.initializeStatus;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
