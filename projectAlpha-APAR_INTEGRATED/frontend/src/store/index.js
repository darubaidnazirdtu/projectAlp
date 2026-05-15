import { configureStore } from '@reduxjs/toolkit';
import authReducer, { initializeSession } from './slices/authSlice.js';
import aparAuthReducer, { aparInitializeSession } from './slices/aparAuthSlice.js';
import { Api } from '../api/Api.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    aparAuth: aparAuthReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

Api.setRoleProvider(() => {
  try {
    const state = store.getState();
    return (state.aparAuth && state.aparAuth.baseRole) || (state.auth && state.auth.baseRole) || null;
  } catch (e) {
    return null;
  }
});

store.dispatch(initializeSession());
store.dispatch(aparInitializeSession());
