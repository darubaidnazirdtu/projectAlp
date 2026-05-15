import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { authCookieName, signAccessToken } from '../utils/jwt.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUserId,
  updateUserPassword,
  updateUserAttributes
} from '../data-access/users.data-access.js';
import { findById as findFacultyById, findByEmail as findFacultyByEmail, listFacultyIds } from '../data-access/faculty.data-access.js';
import { normalizeRoleValue, ROLES } from '../config/roles.js';

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 12); // 12 hours
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH || 5);
const DEFAULT_INITIAL_PASSWORD = process.env.DEFAULT_INITIAL_PASSWORD || '12345';
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProduction ? 'None' : 'Lax',
  secure: isProduction,
  path: '/'
};

const sanitizeUser = (user, additionalInfo = {}) => {
  if (!user) return null;
  return {
    id: user.id,
    userId: user.userId,
    email: user.email,
    name: additionalInfo.name || user.name,
    designation: additionalInfo.designation || user.designation,
    role: normalizeRoleValue(user.role) ?? user.role,
    departmentId: additionalInfo.departmentId || user.departmentId || null
  };
};

const validateRole = (role) => {
  if (!role) {
    throw new ApiError(400, 'Role is required');
  }
  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) {
    throw new ApiError(400, 'Unsupported role provided');
  }
  return normalizedRole;
};

const getAllowedRolesFor = (role) => {
  const normalizedRole = normalizeRoleValue(role) ?? role;

  switch (normalizedRole) {
    case ROLES.IQAC_HEAD:
      return [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD, ROLES.FACULTY];
    case ROLES.DEPARTMENT_HOD:
      return [ROLES.DEPARTMENT_HOD, ROLES.FACULTY];
    case ROLES.FACULTY:
      return [ROLES.FACULTY];
    default:
      return normalizedRole ? [normalizedRole] : [];
  }
};

const canLoginAsRole = (currentRole, requestedRole) => {
  if (!currentRole || !requestedRole) {
    return false;
  }

  const normalizedCurrentRole = normalizeRoleValue(currentRole) ?? currentRole;
  const normalizedRequestedRole = normalizeRoleValue(requestedRole) ?? requestedRole;

  const allowedRoles = getAllowedRolesFor(normalizedCurrentRole);
  return allowedRoles.includes(normalizedRequestedRole);
};

export const registerUser = asyncHandler(async (req, res) => {
  const {
    userId,
    email = null,
    password = DEFAULT_INITIAL_PASSWORD,
    role,
    departmentId = null
  } = req.body;
  const provisionToken = req.headers['x-provision-token'];
  const expectedToken = process.env.ADMIN_PROVISION_TOKEN;

  if (!expectedToken || provisionToken !== expectedToken) {
    throw new ApiError(403, 'User provisioning is not allowed');
  }

  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new ApiError(400, 'User ID is required');
  }

  const facultyMember = await findFacultyById(normalizedUserId);
  if (!facultyMember) {
    throw new ApiError(404, 'User ID does not match any faculty record');
  }

  const passwordToApply = password || DEFAULT_INITIAL_PASSWORD;

  if (passwordToApply.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  const normalizedRole = validateRole(role);

  const existingByUser = await findUserByUserId(normalizedUserId);
  if (existingByUser) {
    throw new ApiError(409, 'User already has an account');
  }

  if (email) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'Email is already registered');
    }
  }

  const passwordHash = await hashPassword(passwordToApply);
  const createdUser = await createUser({
    userId: normalizedUserId,
    email,
    passwordHash,
    role: normalizedRole,
    departmentId: departmentId ?? facultyMember.department_id ?? null
  });

  res.status(201).json(new ApiResponse(201, { user: sanitizeUser(createdUser) }, 'User created successfully'));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role: requestedRole } = req.body ?? {};

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password || !requestedRole) {
    throw new ApiError(400, 'Email, password and role are required');
  }

  const normalizedRequestedRole = validateRole(requestedRole);

  let userRecord = await findUserByEmail(normalizedEmail);
  let facultyMember = null;

  if (userRecord?.userId) {
    facultyMember = await findFacultyById(userRecord.userId);
  }

  if (!facultyMember) {
    facultyMember = await findFacultyByEmail(normalizedEmail);
  }

  if (!userRecord && facultyMember?.faculty_id) {
    const existingByUser = await findUserByUserId(facultyMember.faculty_id);

    if (existingByUser) {
      userRecord = existingByUser;
    } else {
      const derivedRoleInput = facultyMember.role ?? facultyMember.designation ?? ROLES.FACULTY;
      const derivedRole = normalizeRoleValue(derivedRoleInput) ?? ROLES.FACULTY;

      const passwordHash = await hashPassword(DEFAULT_INITIAL_PASSWORD);

      await createUser({
        userId: facultyMember.faculty_id,
        email: normalizedEmail,
        passwordHash,
        role: derivedRole,
        name: facultyMember.name,
        designation: facultyMember.designation,
        departmentId: facultyMember.department_id ?? null
      });

      userRecord = await findUserByUserId(facultyMember.faculty_id);
    }
  }

  if (!userRecord) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!facultyMember && userRecord.userId) {
    facultyMember = await findFacultyById(userRecord.userId);
  }

  // NOTE: We no longer throw if facultyMember is missing.
  // Administrative roles (IQAC Head, etc.) might not have a faculty record.

  const isPasswordValid = await verifyPassword(password, userRecord.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const currentRole = normalizeRoleValue(userRecord.role) ?? userRecord.role;
  // USER REQUEST: Take role from 'users' table, do not overwrite from 'faculty' table.
  // We specificially prioritize currentRole. Only if currentRole is missing (rare/new user) do we look at faculty.
  const effectiveRoleForAccess = currentRole || (facultyMember ? normalizeRoleValue(facultyMember.role) : null) || ROLES.FACULTY;

  if (!canLoginAsRole(effectiveRoleForAccess, normalizedRequestedRole)) {
    throw new ApiError(403, `You are not allowed to sign in as ${normalizedRequestedRole}.`);
  }

  const facultyDepartmentId = facultyMember?.department_id ?? null;
  const facultyEmail = facultyMember?.email ? facultyMember.email.toLowerCase() : null;
  const currentEmail = userRecord.email ? userRecord.email.toLowerCase() : null;

  // We no longer automatically update the role based on faculty table
  const needsRoleUpdate = false;
  const needsDepartmentUpdate = facultyMember && (userRecord.departmentId ?? null) !== facultyDepartmentId;

  let needsEmailUpdate = false;
  let emailToPersist = currentEmail;

  const loginEmail = normalizedEmail;

  if (currentEmail !== loginEmail) {
    const existingByEmail = await findUserByEmail(loginEmail);
    if (!existingByEmail || existingByEmail.id === userRecord.id) {
      needsEmailUpdate = true;
      emailToPersist = loginEmail;
    }
  } else if (facultyEmail && facultyEmail !== currentEmail) {
    const existingByEmail = await findUserByEmail(facultyEmail);
    if (!existingByEmail || existingByEmail.id === userRecord.id) {
      needsEmailUpdate = true;
      emailToPersist = facultyEmail;
    }
  }

  if (needsRoleUpdate || needsDepartmentUpdate || needsEmailUpdate) {
    await updateUserAttributes({
      id: userRecord.id,
      email: emailToPersist,
      role: needsRoleUpdate ? facultyRole : currentRole,
      departmentId: needsDepartmentUpdate ? facultyDepartmentId : (userRecord.departmentId ?? null)
    });

    userRecord = await findUserById(userRecord.id);
  } else {
    userRecord = await findUserById(userRecord.id);
  }

  const tokenRole = normalizeRoleValue(userRecord.role) ?? userRecord.role;
  const payload = {
    sub: userRecord.id,
    userId: userRecord.userId, // Added readable ID
    role: tokenRole,
    departmentId: userRecord.departmentId ?? null
  };

  const accessToken = signAccessToken(payload);

  res.cookie(authCookieName, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_TTL_MS
  });

  const allowedRoles = getAllowedRolesFor(tokenRole);

  res.status(200).json(
    new ApiResponse(200, {
      user: sanitizeUser(userRecord, {
        name: facultyMember?.name,
        designation: facultyMember?.designation,
        departmentId: facultyMember?.department_id
      }),
      activeRole: normalizedRequestedRole,
      allowedRoles
    }, 'Login successful')
  );
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie(authCookieName, {
    ...COOKIE_OPTIONS,
    maxAge: 0
  });

  res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw new ApiError(401, 'Session no longer valid');
  }

  let facultyMember = null;
  if (user.userId) {
    facultyMember = await findFacultyById(user.userId);
  }

  res.status(200).json(new ApiResponse(200, {
    user: sanitizeUser(user, {
      name: facultyMember?.name,
      designation: facultyMember?.designation,
      departmentId: facultyMember?.department_id
    })
  }, 'Profile fetched'));
});

export const verifyRole = asyncHandler(async (req, res) => {
  const { role: clientRole } = req.body ?? {};

  if (!clientRole) {
    throw new ApiError(400, 'Client role is required');
  }

  const normalizedClientRole = validateRole(clientRole);

  const currentRole = validateRole(req.user.role);

  if (currentRole !== normalizedClientRole) {
    throw new ApiError(409, 'Role mismatch detected');
  }

  res.status(200).json(
    new ApiResponse(200, { role: currentRole }, 'Role verified')
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword = DEFAULT_INITIAL_PASSWORD } = req.body ?? {};

  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    throw new ApiError(400, 'User ID is required');
  }

  const facultyMember = await findFacultyById(normalizedUserId);
  if (!facultyMember) {
    throw new ApiError(404, 'User ID does not match any faculty record');
  }

  const userRecord = await findUserByUserId(normalizedUserId);
  if (!userRecord) {
    throw new ApiError(404, 'No account exists for the provided user ID');
  }

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(userRecord.id, passwordHash);

  res.status(200).json(new ApiResponse(200, {}, 'Password reset. You can now sign in with the new password.'));
});

export const listUserIds = asyncHandler(async (req, res) => {
  const ids = await listFacultyIds();
  res.status(200).json(new ApiResponse(200, { userIds: ids }, 'User IDs fetched'));
});
