import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, normalizeRoleValue } from '../config/roles.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUserId,
  listUsers,
  updateUserAttributes,
  updateUserPassword
} from '../data-access/users.data-access.js';

const DEFAULT_INITIAL_PASSWORD = process.env.DEFAULT_INITIAL_PASSWORD || '12345';
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH || 5);

const assertIqacHead = (req) => {
  const role = normalizeRoleValue(req.user?.systemRole ?? req.user?.role);
  if (role !== ROLES.IQAC_HEAD) {
    throw new ApiError(403, 'Only IQAC Head can manage users');
  }
};

const normalizeEmail = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim().toLowerCase();
  return trimmed || null;
};

const sanitizeAdminUser = (user) => ({
  id: user.id,
  userId: user.userId,
  email: user.email,
  name: user.name,
  designation: user.designation,
  role: normalizeRoleValue(user.role) ?? user.role,
  departmentId: user.departmentId ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const getManagedUsers = asyncHandler(async (req, res) => {
  assertIqacHead(req);

  const users = await listUsers();

  res.status(200).json(
    new ApiResponse(200, {
      users: users.map(sanitizeAdminUser)
    }, 'Users fetched successfully')
  );
});

export const createManagedUser = asyncHandler(async (req, res) => {
  assertIqacHead(req);

  const {
    userId,
    email,
    name = null,
    designation = null,
    password = DEFAULT_INITIAL_PASSWORD,
    role,
    departmentId = null
  } = req.body ?? {};

  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    throw new ApiError(400, 'User ID is required');
  }

  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) {
    throw new ApiError(400, 'Valid role is required');
  }

  const emailToUse = normalizeEmail(email);
  if (!emailToUse) {
    throw new ApiError(400, 'Email is required');
  }

  if (password && password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  const existingByUserId = await findUserByUserId(normalizedUserId);
  if (existingByUserId) {
    throw new ApiError(409, 'A user account already exists for this faculty member');
  }

  const existingByEmail = await findUserByEmail(emailToUse);
  if (existingByEmail) {
    throw new ApiError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(password || DEFAULT_INITIAL_PASSWORD);
  const createdUser = await createUser({
    userId: normalizedUserId,
    email: emailToUse,
    passwordHash,
    role: normalizedRole,
    name: name?.trim() || null,
    designation: designation?.trim() || null,
    departmentId: departmentId?.trim() || null
  });

  res.status(201).json(
    new ApiResponse(201, { user: sanitizeAdminUser(createdUser) }, 'User created successfully')
  );
});

export const updateManagedUser = asyncHandler(async (req, res) => {
  assertIqacHead(req);

  const { id } = req.params;
  const existingUser = await findUserById(id);

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  const {
    email,
    role,
    departmentId = undefined,
    password = undefined
  } = req.body ?? {};

  const emailToUse = email === undefined ? existingUser.email : normalizeEmail(email);
  if (email !== undefined && !emailToUse) {
    throw new ApiError(400, 'Email cannot be empty');
  }

  if (emailToUse && emailToUse !== existingUser.email) {
    const emailOwner = await findUserByEmail(emailToUse);
    if (emailOwner && emailOwner.id !== existingUser.id) {
      throw new ApiError(409, 'Email is already registered');
    }
  }

  const normalizedRole = role === undefined ? existingUser.role : normalizeRoleValue(role);
  if (role !== undefined && !normalizedRole) {
    throw new ApiError(400, 'Valid role is required');
  }

  const updatedUser = await updateUserAttributes({
    id,
    email: emailToUse,
    role: normalizedRole,
    name: existingUser.name,
    designation: existingUser.designation,
    departmentId: departmentId === undefined ? existingUser.departmentId : departmentId
  });

  // If admin provided a new password, hash and update it
  let finalUser = updatedUser;
  if (password !== undefined) {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    const passwordHash = await hashPassword(password);
    finalUser = await updateUserPassword(id, passwordHash);
  }

  res.status(200).json(
    new ApiResponse(200, { user: sanitizeAdminUser(finalUser) }, 'User updated successfully')
  );
});