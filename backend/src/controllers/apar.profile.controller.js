import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { FacultyProfile } from '../models/facultyProfile.model.js';
import { Faculty, User } from '../models/index.js';
import { assertFacultyAccess, getCurrentFacultyId } from '../utils/apar-access.js';

const sanitizeProfile = (doc) => {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
};

const buildDefaultProfile = async (facultyId) => {
  const faculty = await Faculty.findOne({ faculty_id: facultyId }).lean();
  const user = await User.findOne({ user_id: facultyId }).lean();

  return {
    faculty_id: facultyId,
    basic_info: {
      full_name: faculty?.name || user?.name || '',
      aadhaar_card: '',
      caste_category: '',
      profile_photo_url: user?.avatar || user?.avatar_url || '',
      gender: faculty?.gender || '',
      date_of_birth: faculty?.date_of_birth || null,
      nationality: '',
      marital_status: ''
    },
    contact_info: {
      mobile_number: faculty?.phone || '',
      alternate_mobile_number: '',
      email_address: user?.email || faculty?.email || '',
      alternate_email_address: '',
      current_address: '',
      permanent_address: '',
      permanent_city: '',
      permanent_state: '',
      permanent_postal_code: '',
      city: '',
      state: '',
      postal_code: '',
      emergency_contact_name: '',
      emergency_contact_number: ''
    },
    professional_info: {
      faculty_staff_id: user?.userId || facultyId,
      designation: faculty?.designation || user?.designation || '',
      department: faculty?.department_id || user?.departmentId || '',
      specialization: faculty?.specialization ? [faculty.specialization] : [],
      date_of_joining: faculty?.joining_date || null,
      date_of_continuous_employment: null,
      employment_type: faculty?.employment_type || '',
      present_grade: '',
      years_of_experience: null,
      current_courses: [],
      office_location: '',
      office_contact_number: ''
    },
    educational_qualifications: [],
    social_links: {
      linkedin_profile: '',
      personal_website: '',
      google_scholar_profile: '',
      researchgate_profile: '',
      orcid_id: '',
      scopus_author_id: ''
    }
  };
};

export const getSelfProfile = asyncHandler(async (req, res) => {
  const facultyId = getCurrentFacultyId(req.user);
  if (!facultyId) throw new ApiError(400, 'Faculty ID not found');

  const existing = await FacultyProfile.findOne({ faculty_id: facultyId }).lean();
  const payload = existing || await buildDefaultProfile(facultyId);

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(payload) }, 'Profile fetched'));
});

export const upsertSelfProfile = asyncHandler(async (req, res) => {
  const facultyId = getCurrentFacultyId(req.user);
  if (!facultyId) throw new ApiError(400, 'Faculty ID not found');

  const update = req.body?.profile || req.body || {};
  if (update.faculty_id && String(update.faculty_id) !== String(facultyId)) {
    throw new ApiError(403, 'Cannot modify another faculty profile');
  }

  const doc = await FacultyProfile.findOneAndUpdate(
    { faculty_id: facultyId },
    { $set: { ...update, faculty_id: facultyId } },
    { new: true, upsert: true }
  ).lean();

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(doc) }, 'Profile saved'));
});

export const getProfileByFaculty = asyncHandler(async (req, res) => {
  const requestedFacultyId = String(req.params.faculty_id || '').trim();
  if (!requestedFacultyId) throw new ApiError(400, 'Faculty ID is required');

  await assertFacultyAccess(req.user, requestedFacultyId);

  const existing = await FacultyProfile.findOne({ faculty_id: requestedFacultyId }).lean();
  const payload = existing || await buildDefaultProfile(requestedFacultyId);

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(payload) }, 'Profile fetched'));
});

export const updateProfileByFaculty = asyncHandler(async (req, res) => {
  const requestedFacultyId = String(req.params.faculty_id || '').trim();
  if (!requestedFacultyId) throw new ApiError(400, 'Faculty ID is required');

  const currentFacultyId = getCurrentFacultyId(req.user);
  if (currentFacultyId !== requestedFacultyId) {
    throw new ApiError(403, 'Only the faculty can edit their own profile');
  }

  const update = req.body?.profile || req.body || {};
  const doc = await FacultyProfile.findOneAndUpdate(
    { faculty_id: requestedFacultyId },
    { $set: { ...update, faculty_id: requestedFacultyId } },
    { new: true, upsert: true }
  ).lean();

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(doc) }, 'Profile saved'));
});
