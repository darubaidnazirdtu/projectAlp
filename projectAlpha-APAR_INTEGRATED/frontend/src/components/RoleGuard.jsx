import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyRole, selectBaseRole, selectInitializeStatus } from '../store/slices/authSlice.js';

export default function RoleGuard() {
  const dispatch = useDispatch();
  const baseRole = useSelector(selectBaseRole);
  const initializeStatus = useSelector(selectInitializeStatus);

  const lastVerifiedRef = useRef(null);
  const pendingRoleRef = useRef(null);

  useEffect(() => {
    if (initializeStatus !== 'succeeded') {
      return;
    }

    if (!baseRole) {
      lastVerifiedRef.current = null;
      pendingRoleRef.current = null;
      return;
    }

    if (baseRole === lastVerifiedRef.current) {
      return;
    }

    if (pendingRoleRef.current === baseRole) {
      return;
    }

    pendingRoleRef.current = baseRole;
    const previousRole = lastVerifiedRef.current;

    dispatch(verifyRole(baseRole)).then((action) => {
      pendingRoleRef.current = null;

      if (verifyRole.fulfilled.match(action)) {
        lastVerifiedRef.current = action.payload;
      } else {
        lastVerifiedRef.current = previousRole ?? null;
      }
    });
  }, [dispatch, initializeStatus, baseRole]);

  return null;
}
