import { authCookieName, verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/api-error.js';
import { findUserById } from '../data-access/users.data-access.js';
import { findById as findFacultyById } from '../data-access/faculty.data-access.js';
import { getAllowedRolesFor } from '../config/permissions.js';
import { normalizeRoleValue } from '../config/roles.js';

const extractToken = (req) => {
  const cookieToken = req.cookies?.[authCookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  return null;
};

export const authenticate = async (req, res, next) => {
  try {
    // console.log('Authenticating request...');
    // debug: log when authenticate runs to trace unexpected invocations
    try {
      console.warn('[auth] authenticate called for', req.method, req.originalUrl || req.url, 'bypass=', !!req.headers['x-bypass-auth-redirect']);
    } catch (e) { }

    // Allow unauthenticated access to password reset endpoints
    // (some frontends call POST /apar/auth/forgot-password without a session)
    const url = req.originalUrl || req.url || '';
    if (typeof url === 'string' && url.toLowerCase().includes('/forgot-password')) {
      return next();
    }
    // Also allow bypass when client explicitly requests it (header set by frontend)
    const bypassHeader = req.headers['x-bypass-auth-redirect'] || req.headers['X-Bypass-Auth-Redirect'];
    if (bypassHeader) return next();
    const token = extractToken(req);
    if (!token) {
      // throw new ApiError(401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);

    // consolidated: all users (IQAC, HOD, Faculty, APAR) now in MongoDB 'users' collection
    let user = await findUserById(decoded.sub);
    const roleFromToken = normalizeRoleValue(decoded.role) ?? decoded.role ?? null;

    if (user) {
      req.user = {
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: roleFromToken || (normalizeRoleValue(user.role) ?? user.role),
        systemRole: normalizeRoleValue(user.role) ?? user.role,
        aparRole: user.aparRole ?? null,
        academicYear: decoded.academicYear ?? null,
        departmentId: user.departmentId ?? null
      };
      req.authTokenPayload = decoded;
      return next();
    }

    // Fallback: try faculty table (for any lingering sessions using faculty_id)
    const faculty = await findFacultyById(decoded.sub);
    if (faculty) {
      req.user = {
        id: faculty.faculty_id,
        userId: faculty.faculty_id,
        email: faculty.email ? faculty.email.toLowerCase() : null,
        role: roleFromToken || (normalizeRoleValue(faculty.role) ?? faculty.role),
        systemRole: normalizeRoleValue(faculty.role) ?? faculty.role,
        departmentId: faculty.department_id ?? null
      };
      req.authTokenPayload = decoded;
      return next();
    }

    throw new ApiError(401, 'Session is no longer valid');

    next();
  } catch (error) {
    next(error);
  }
};

export const createRouteGuard = (basePath) => {
  return (req, res, next) => {
    const allowedRoles = getAllowedRolesFor(basePath, req.method.toUpperCase());

    if (!allowedRoles) {
      return next();
    }

    const userRole = normalizeRoleValue(req.user?.role) ?? req.user?.role;
    if (!userRole) {
      // return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(userRole)) {
      // Fallback: Check if the user's underlying system role allows access
      // This handles cases where the user is logged in with a specialized role (e.g. APAR Officer)
      // but still needs access to general resources (e.g. Faculty endpoints)
      const systemRole = req.user?.systemRole;
      if (systemRole && allowedRoles.includes(systemRole)) {
        console.log('[auth] route access granted via systemRole', systemRole, 'for', basePath);
        return next();
      }

      console.error(`[auth-error] Access Denied: Method=${req.method}, Path=${basePath}`);
      console.error(`[auth-error] User Role: '${req.user?.role}' (Normalized: '${userRole}')`);
      console.error(`[auth-error] System Role: '${systemRole}'`);
      console.error(`[auth-error] Allowed Roles: ${JSON.stringify(allowedRoles)}`);
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    console.log('[auth] route access granted for', req.method, basePath, 'to role', userRole);

    return next();
  };
};
