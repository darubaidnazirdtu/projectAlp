import { User } from '../models/user.model.js';
import { normalizeRoleValue } from '../config/roles.js';

const mapUser = (user) => {
  if (!user) return null;

  return {
    id: user._id.toString(),
    userId: user.user_id,
    email: user.email,
    name: user.name,
    designation: user.designation,
    role: normalizeRoleValue(user.role) ?? user.role,
    aparRole: user.apar_role,
    reportingOfficerId: user.reporting_officer_id,
    reviewingOfficerId: user.reviewing_officer_id,
    departmentId: user.department_id,
    sessionToken: user.session_token,
    sessionExpiresAt: user.session_expires_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    passwordHash: user.password_hash // Often needed internally for checks
  };
};

export const createUser = async ({
  userId,
  email,
  passwordHash,
  role,
  name = null,
  designation = null,
  aparRole = null,
  reportingOfficerId = null,
  reviewingOfficerId = null,
  departmentId = null
}) => {
  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) {
    throw new Error(`Invalid role supplied: ${role}`);
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error('User ID is required');
  }

  try {
    const user = new User({
      user_id: normalizedUserId,
      email: email ? email.toLowerCase() : null,
      password_hash: passwordHash,
      role: normalizedRole,
      name: name,
      designation: designation,
      apar_role: aparRole,
      reporting_officer_id: reportingOfficerId,
      reviewing_officer_id: reviewingOfficerId,
      department_id: departmentId
    });
    await user.save();
    return mapUser(user);
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("User already exists with this email or user_id");
    }
    throw err;
  }
};

export const findUserByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  return mapUser(user);
};

export const findUserByUserId = async (userId) => {
  const user = await User.findOne({ user_id: userId });
  return mapUser(user);
};

export const findUserById = async (id) => {
  try {
    const user = await User.findById(id);
    return mapUser(user);
  } catch (e) {
    return null;
  }
};

export const listUsers = async () => {
  const users = await User.find().sort({ created_at: -1 });
  return users.map(mapUser);
};

export const updateUserSession = async (id, sessionToken, expiresAt) => {
  const user = await User.findByIdAndUpdate(
    id,
    {
      session_token: sessionToken,
      session_expires_at: expiresAt
    },
    { new: true }
  );
  return mapUser(user);
};

export const clearUserSession = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    {
      session_token: null,
      session_expires_at: null
    },
    { new: true }
  );
  return mapUser(user);
};

export const updateUserPassword = async (id, passwordHash) => {
  const user = await User.findByIdAndUpdate(
    id,
    { password_hash: passwordHash },
    { new: true }
  );
  return mapUser(user);
};

export const updateUserAttributes = async ({
  id,
  email,
  role,
  aparRole,
  reportingOfficerId,
  reviewingOfficerId,
  name,
  designation,
  departmentId
}) => {
  if (!id) {
    throw new Error('User ID is required for attribute update');
  }

  const updateData = {
    ...(role !== undefined ? (() => {
      const normalizedRole = normalizeRoleValue(role);
      if (!normalizedRole) {
        throw new Error(`Invalid role supplied: ${role}`);
      }
      return { role: normalizedRole };
    })() : {}),
    ...(aparRole !== undefined ? { apar_role: aparRole } : {}),
    ...(reportingOfficerId !== undefined ? { reporting_officer_id: reportingOfficerId } : {}),
    ...(reviewingOfficerId !== undefined ? { reviewing_officer_id: reviewingOfficerId } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(designation !== undefined ? { designation } : {}),
    ...(departmentId !== undefined ? { department_id: departmentId } : {})
  };
  if (email !== undefined && email !== null) updateData.email = email.toLowerCase();

  try {
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    return mapUser(user);
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Email already in use");
    }
    throw err;
  }
};

export const findUsersByOfficerMapping = async (officerId, type) => {
  const query = {};
  if (type === 'reporting') {
    query.reporting_officer_id = officerId;
  } else if (type === 'reviewing') {
    query.reviewing_officer_id = officerId;
  } else {
    throw new Error('Invalid mapping type');
  }

  const users = await User.find(query);
  return users.map(u => mapUser(u));
};

