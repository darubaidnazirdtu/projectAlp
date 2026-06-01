import { ApiError } from './api-error.js';
import { User } from '../models/user.model.js';
import { normalizeRoleValue, ROLES } from '../config/aparRoles.js';

const normalizeId = (value) => value ? String(value).trim() : null;

export const getCurrentFacultyId = (user) => normalizeId(user?.userId || user?.faculty_id || user?.id);

export const getOfficerAccessQuery = async (user, type) => {
  const officerId = getCurrentFacultyId(user);
  if (!officerId) {
    return [];
  }

  const possibleOfficerIds = [officerId];
  if (user?.id && !possibleOfficerIds.includes(user.id)) possibleOfficerIds.push(user.id);
  if (user?.sub && !possibleOfficerIds.includes(user.sub)) possibleOfficerIds.push(user.sub);

  const field = type === 'reviewing' ? 'reviewing_officer_id' : 'reporting_officer_id';
  const assignedUsers = await User.find({ [field]: { $in: possibleOfficerIds } }).select('user_id').lean();
  return assignedUsers.map((assignedUser) => assignedUser.user_id).filter(Boolean);
};

export const assertFacultyAccess = async (user, facultyId) => {
  const normalizedFacultyId = normalizeId(facultyId);
  if (!normalizedFacultyId) {
    throw new ApiError(400, 'Faculty ID is required');
  }

  const currentFacultyId = getCurrentFacultyId(user);
  const role = normalizeRoleValue(user?.role);

  // Allow IQAC users to access any faculty profile
  const normalizedRole = String(user?.role || '').toLowerCase();
  if (normalizedRole.includes('iqac') || normalizedRole.includes('dean')) {
    return true;
  }

  // Always allow users to access their own record regardless of role
  if (currentFacultyId === normalizedFacultyId) {
    return true;
  }

  const reportingFacultyIds = await getOfficerAccessQuery(user, 'reporting');
  if (reportingFacultyIds.includes(normalizedFacultyId)) {
    return true;
  }

  const reviewingFacultyIds = await getOfficerAccessQuery(user, 'reviewing');
  if (reviewingFacultyIds.includes(normalizedFacultyId)) {
    return true;
  }

  throw new ApiError(403, 'You do not have permission to access this APAR record');
};

export const resolveFacultyIdForRequest = async (req, requestedFacultyId) => {
  const facultyId = normalizeId(requestedFacultyId || req.user?.userId || req.user?.faculty_id || req.user?.id);
  await assertFacultyAccess(req.user, facultyId);
  return facultyId;
};

export const buildListFormsQuery = async (user, ay) => {
  const role = normalizeRoleValue(user?.role);
  const currentFacultyId = getCurrentFacultyId(user);
  const query = { ay };

  if (role === ROLES.OFFICER) {
    query.faculty_id = currentFacultyId;
    return query;
  }

  if (role === ROLES.REPORTING_OFFICER) {
    const assigned = await getOfficerAccessQuery(user, 'reporting');
    query.faculty_id = { $in: assigned };
    return query;
  }

  if (role === ROLES.REVIEWING_OFFICER) {
    const assigned = await getOfficerAccessQuery(user, 'reviewing');
    query.faculty_id = { $in: assigned };
    return query;
  }

  query.faculty_id = currentFacultyId;
  return query;
};
