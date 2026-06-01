import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, normalizeRoleValue } from '../config/roles.js';
import { ROLES as APAR_ROLES } from '../config/aparRoles.js';
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  findUserByUserId,
  listUsers,
  updateUserAttributes,
  updateUserPassword
} from '../data-access/users.data-access.js';
import { getByDepartmentId } from '../data-access/departments.data-access.js';
import { set as createFaculty, findByEmail as findFacultyByEmail, findById as findFacultyById } from '../data-access/faculty.data-access.js';
import { FacultyProfile } from '../models/facultyProfile.model.js';
import { Faculty } from '../models/index.js';
import { validatePasswordPolicy } from '../utils/password-policy.js';
import { isValidEmail } from '../utils/validation.js';

const DEFAULT_INITIAL_PASSWORD = process.env.DEFAULT_INITIAL_PASSWORD || '';

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

const normalizeBoolean = (value) => value === true || value === 'true' || value === 'yes';

const sanitizeAdminUser = (user) => ({
  id: user.id,
  userId: user.userId,
  email: user.email,
  name: user.name,
  designation: user.designation,
  role: normalizeRoleValue(user.role) ?? user.role,
  departmentId: user.departmentId ?? null,
  aparRole: user.aparRole ?? null,
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
    departmentId = null,
    isFaculty = undefined,
    isReportingOfficer = false,
    isReviewingOfficer = false
  } = req.body ?? {};

  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    throw new ApiError(400, 'User ID is required');
  }

  if (normalizedUserId.length < 5) {
    throw new ApiError(400, 'User ID must be at least 5 characters');
  }

  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) {
    throw new ApiError(400, 'Valid role is required');
  }

  const emailToUse = normalizeEmail(email);
  if (!emailToUse) {
    throw new ApiError(400, 'Email is required');
  }

  if (!isValidEmail(emailToUse)) {
    throw new ApiError(400, 'Valid email is required');
  }

  const normalizedDepartmentId = departmentId?.trim();
  if (!normalizedDepartmentId) {
    throw new ApiError(400, 'Department is required');
  }

  const department = await getByDepartmentId(normalizedDepartmentId);
  if (!department) {
    throw new ApiError(400, 'Valid department is required');
  }

  let passwordToHash = password || DEFAULT_INITIAL_PASSWORD;
  if (!passwordToHash) {
    // Generate default password: first 5 lowercase letters of userId + @888
    passwordToHash = normalizedUserId.substring(0, 5).toLowerCase() + '@888';
  }
  // Password policy validation bypassed for auto-generated passwords

  const shouldCreateFaculty = isFaculty !== undefined ? normalizeBoolean(isFaculty) : ['Faculty Member', 'IQAC Head', 'Dean', 'Department HOD'].includes(normalizedRole);
  const shouldBeReportingOfficer = normalizeBoolean(isReportingOfficer);
  const shouldBeReviewingOfficer = normalizeBoolean(isReviewingOfficer);

  if (shouldBeReportingOfficer && shouldBeReviewingOfficer) {
    throw new ApiError(400, 'A user cannot be both Reporting Officer and Reviewing Officer');
  }

  if (shouldCreateFaculty && !designation?.trim()) {
    throw new ApiError(400, 'Designation is required for faculty details');
  }

  const aparRole = normalizedRole === ROLES.DEAN
    ? APAR_ROLES.DEAN
    : shouldBeReportingOfficer
    ? APAR_ROLES.REPORTING_OFFICER
    : shouldBeReviewingOfficer
      ? APAR_ROLES.REVIEWING_OFFICER
      : shouldCreateFaculty
        ? APAR_ROLES.OFFICER
        : null;

  const existingByUserId = await findUserByUserId(normalizedUserId);
  if (existingByUserId) {
    throw new ApiError(409, 'A user account already exists for this faculty member');
  }

  const existingByEmail = await findUserByEmail(emailToUse);
  if (existingByEmail) {
    throw new ApiError(409, 'Email is already registered');
  }

  if (shouldCreateFaculty) {
    const existingFacultyById = await findFacultyById(normalizedUserId);
    if (existingFacultyById) {
      throw new ApiError(409, 'A faculty profile already exists for this user ID');
    }

    const existingFacultyByEmail = await findFacultyByEmail(emailToUse);
    if (existingFacultyByEmail) {
      throw new ApiError(409, 'A faculty profile already exists for this email');
    }
  }

  const passwordHash = await hashPassword(passwordToHash);
  const createdUser = await createUser({
    userId: normalizedUserId,
    email: emailToUse,
    passwordHash,
    role: normalizedRole,
    name: name?.trim() || null,
    designation: designation?.trim() || null,
    aparRole,
    departmentId: normalizedDepartmentId
  });

  if (shouldCreateFaculty) {
    await createFaculty({
      faculty_id: normalizedUserId,
      email: emailToUse,
      name: name.trim(),
      designation: designation.trim(),
      department_id: normalizedDepartmentId,
      employment_type: 'Regular'
    }, {
      id: req.user?.id,
      userId: req.user?.userId || req.user?.id
    });

    // Also create FacultyProfile entry
    await FacultyProfile.findOneAndUpdate(
      { faculty_id: normalizedUserId },
      {
        $set: {
          faculty_id: normalizedUserId,
          basic_info: {
            full_name: name.trim(),
            gender: '',
            date_of_birth: null
          },
          contact_info: {
            email_address: emailToUse,
            mobile_number: ''
          },
          professional_info: {
            designation: designation.trim(),
            department: normalizedDepartmentId,
            specialization: [],
            date_of_joining: null,
            date_of_continuous_employment: null,
            employment_type: 'Regular',
            present_grade: '',
            years_of_experience: null
          },
          educational_qualifications: []
        }
      },
      { upsert: true, new: true }
    );
  }

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
    password = undefined,
    aparRole = undefined
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

  const nextAparRole = normalizedRole === ROLES.DEAN
    ? APAR_ROLES.DEAN
    : aparRole === undefined
      ? (existingUser.aparRole === APAR_ROLES.DEAN ? null : existingUser.aparRole)
      : aparRole;

  const updatedUser = await updateUserAttributes({
    id,
    email: emailToUse,
    role: normalizedRole,
    name: existingUser.name,
    designation: existingUser.designation,
    departmentId: departmentId === undefined ? existingUser.departmentId : departmentId,
    aparRole: nextAparRole
  });

  // If admin provided a new password, hash and update it
  let finalUser = updatedUser;
  if (password !== undefined) {
    if (!password) {
      throw new ApiError(400, 'Password cannot be empty');
    }
    validatePasswordPolicy(password);

    const passwordHash = await hashPassword(password);
    finalUser = await updateUserPassword(id, passwordHash);
  }

  res.status(200).json(
    new ApiResponse(200, { user: sanitizeAdminUser(finalUser) }, 'User updated successfully')
  );
});

export const deleteManagedUser = asyncHandler(async (req, res) => {
  assertIqacHead(req);

  const { id } = req.params;
  const existingUser = await findUserById(id);

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  const facultyId = existingUser.userId;

  // Delete user record
  await deleteUserById(id);

  // Delete faculty records if they exist
  if (facultyId) {
    // Delete from FacultyProfile collection
    await FacultyProfile.deleteOne({ faculty_id: facultyId });

    // Delete from legacy Faculty collection
    await Faculty.deleteOne({ faculty_id: facultyId });

    // Delete all APAR forms for this faculty
    const { AparForm } = await import('../models/aparForm.model.js');
    await AparForm.deleteMany({ faculty_id: facultyId });
  }

  res.status(200).json(
    new ApiResponse(200, null, 'User deleted successfully')
  );
});
