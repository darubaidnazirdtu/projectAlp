import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { aparAuthService } from '../../services/aparAuth.service.js';
import { ROLES } from '../../config/aparRoles.js';

const extractErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return fallback;
};

const getAllowedRolesFor = (role) => {
  if (!role) return [];
  const normalized = role.trim().toLowerCase();
  if (normalized === ROLES.REPORTING_OFFICER.toLowerCase()) {
    return [ROLES.REPORTING_OFFICER, ROLES.REVIEWING_OFFICER, ROLES.OFFICER];
  }
  if (normalized === ROLES.REVIEWING_OFFICER.toLowerCase()) {
    return [ROLES.REVIEWING_OFFICER, ROLES.OFFICER];
  }
  if (normalized === ROLES.OFFICER.toLowerCase()) {
    return [ROLES.OFFICER];
  }
  return [role];
};

const initialState = {
  user: null,
  baseRole: null,
  role: null,
  allowedRoles: [],
  academicYear: null,
  status: 'idle',
  initializeStatus: 'idle',
  error: null
};

export const aparLogin = createAsyncThunk('aparAuth/login', async ({ email, password, role, academic_year }, thunkAPI) => {
  try {
    const response = await aparAuthService.login(email, password, role, academic_year);
    localStorage.setItem('apar_auth_session', 'true');
    return response;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to sign in'));
  }
});

export const aparLogout = createAsyncThunk('aparAuth/logout', async (_, thunkAPI) => {
  try {
    await aparAuthService.logout();
    localStorage.removeItem('apar_auth_session');
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to sign out'));
  }
});

export const aparInitializeSession = createAsyncThunk('aparAuth/initializeSession', async (_, thunkAPI) => {
  if (!localStorage.getItem('apar_auth_session')) {
    return null;
  }
  try {
    const response = await aparAuthService.getProfile();
    return response.user;
  } catch (error) {
    localStorage.removeItem('apar_auth_session');
    if (error.response?.status === 401) return null;
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Unable to load session'));
  }
});

export const aparVerifyRole = createAsyncThunk('aparAuth/verifyRole', async (role, thunkAPI) => {
  try {
    const response = await aparAuthService.verifyRole(role);
    return response.role;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Role verification failed'));
  }
});

export const aparChangePassword = createAsyncThunk('aparAuth/changePassword', async ({ oldPassword, newPassword }, thunkAPI) => {
  try {
    const response = await aparAuthService.changePassword(oldPassword, newPassword);
    return response;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error, 'Password change failed'));
  }
});

const aparSlice = createSlice({
  name: 'aparAuth',
  initialState,
  reducers: {
    setRoleLocally(state, action) {
      state.role = action.payload ?? null;
    },
    resetAparState() {
      return { ...initialState, initializeStatus: 'succeeded' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(aparLogin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(aparLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.initializeStatus = 'succeeded';
        state.user = action.payload?.user ?? null;
        state.baseRole = action.payload?.user?.role ?? null;
        state.role = action.payload?.activeRole ?? action.payload?.user?.role ?? null;
        state.academicYear = action.payload?.academicYear ?? null;
        state.allowedRoles = Array.isArray(action.payload?.allowedRoles) && action.payload.allowedRoles.length
          ? action.payload.allowedRoles
          : getAllowedRolesFor(action.payload?.user?.role);
        state.error = null;
      })
      .addCase(aparLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to sign in';
        state.user = null;
        state.baseRole = null;
        state.role = null;
        state.allowedRoles = [];
      })
      .addCase(aparLogout.fulfilled, () => ({ ...initialState, initializeStatus: 'succeeded' }))
      .addCase(aparLogout.rejected, () => ({ ...initialState, initializeStatus: 'succeeded' }))
      .addCase(aparInitializeSession.pending, (state) => {
        state.initializeStatus = 'loading';
        state.error = null;
      })
      .addCase(aparInitializeSession.fulfilled, (state, action) => {
        state.initializeStatus = 'succeeded';
        state.error = null;
        state.user = action.payload;
        state.baseRole = action.payload?.role ?? null;
        state.role = action.payload?.role ?? null;
        state.academicYear = action.payload?.academicYear ?? null;
        state.allowedRoles = getAllowedRolesFor(action.payload?.role);
      })
      .addCase(aparInitializeSession.rejected, (state, action) => {
        state.initializeStatus = 'failed';
        state.error = action.payload || 'Unable to load session';
        state.user = null;
        state.baseRole = null;
        state.role = null;
        state.allowedRoles = [];
      })
      .addCase(aparVerifyRole.pending, (state) => {
        state.verifyStatus = 'loading';
        state.verifyError = null;
      })
      .addCase(aparVerifyRole.fulfilled, (state, action) => {
        state.verifyStatus = 'succeeded';
        state.verifyError = null;
        state.baseRole = action.payload;
        state.allowedRoles = getAllowedRolesFor(action.payload);
        if (state.user) state.user = { ...state.user, role: action.payload };
      })
      .addCase(aparVerifyRole.rejected, (state, action) => {
        state.verifyStatus = 'failed';
        state.verifyError = action.payload || 'Role verification failed';
      });
  }
});

export const { setRoleLocally, resetAparState } = aparSlice.actions;

export const selectAparIsAuthenticated = (state) => Boolean(state.aparAuth.user);
export const selectAparUser = (state) => state.aparAuth.user;
export const selectAparRole = (state) => state.aparAuth.role;
export const selectAparAcademicYear = (state) => state.aparAuth.academicYear;
export const selectAparBaseRole = (state) => state.aparAuth.baseRole;
export const selectAparAllowedRoles = (state) => state.aparAuth.allowedRoles;

export default aparSlice.reducer;
