import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { FacultyProfile } from '../models/facultyProfile.model.js';
import { Faculty, User } from '../models/index.js';
import { assertFacultyAccess, getCurrentFacultyId } from '../utils/apar-access.js';
import { getTemporaryDocument, recordCompletedTemporaryDocument, removeTemporaryDocument, discardTemporaryDocument } from '../services/apar-temp-document.service.js';
import { uploadLocalFile, createProfileEducationDocumentPath } from '../services/minio.service.js';

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
  
  if (payload.professional_info) {
    payload.professional_info.faculty_staff_id = facultyId;
  }

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(payload) }, 'Profile fetched'));
});

export const upsertSelfProfile = asyncHandler(async (req, res) => {
  const facultyId = getCurrentFacultyId(req.user);
  if (!facultyId) throw new ApiError(400, 'Faculty ID not found');

  const update = req.body?.profile || req.body || {};
  if (update.faculty_id && String(update.faculty_id) !== String(facultyId)) {
    throw new ApiError(403, 'Cannot modify another faculty profile');
  }
  
  if (update.professional_info) {
    update.professional_info.faculty_staff_id = facultyId;
  }

  const temporaryIds = [];

  if (Array.isArray(update.educational_qualifications)) {
    for (const qual of update.educational_qualifications) {
      if (qual.certificate_url && typeof qual.certificate_url === 'object' && qual.certificate_url.tempId) {
        const tempId = qual.certificate_url.tempId;
        temporaryIds.push(tempId);
        const temp = getTemporaryDocument(tempId, req.user.id);
        if (temp) {
          const facultyName = update.basic_info?.full_name || 'faculty';
          const objectPath = createProfileEducationDocumentPath(facultyName);
          await uploadLocalFile({
            filePath: temp.filePath,
            objectPath,
            contentType: 'application/pdf'
          });
          recordCompletedTemporaryDocument(tempId, req.user.id, objectPath);
          await removeTemporaryDocument(tempId);
          qual.certificate_url = objectPath;
        } else {
          qual.certificate_url = '';
        }
      }
    }
  }

  try {

  const doc = await FacultyProfile.findOneAndUpdate(
    { faculty_id: facultyId },
    { $set: { ...update, faculty_id: facultyId } },
    { new: true, upsert: true }
  ).lean();

  res.status(200).json(new ApiResponse(200, { profile: sanitizeProfile(doc) }, 'Profile saved'));
} catch (e) {
  await Promise.allSettled(temporaryIds.map(tempId => discardTemporaryDocument(tempId)));
  throw e;
}
});

export const getProfileByFaculty = asyncHandler(async (req, res) => {
  const requestedFacultyId = String(req.params.faculty_id || '').trim();
  if (!requestedFacultyId) throw new ApiError(400, 'Faculty ID is required');

  await assertFacultyAccess(req.user, requestedFacultyId);

  // Check FacultyProfile collection first
  let existing = await FacultyProfile.findOne({ faculty_id: requestedFacultyId }).lean();

  // If not found, check legacy Faculty collection and transform
  if (!existing) {
    const legacyFaculty = await Faculty.findOne({ faculty_id: requestedFacultyId }).lean();
    if (legacyFaculty) {
      existing = {
        faculty_id: legacyFaculty.faculty_id,
        basic_info: {
          full_name: legacyFaculty.name,
          gender: legacyFaculty.gender,
          date_of_birth: legacyFaculty.date_of_birth
        },
        contact_info: {
          email_address: legacyFaculty.email,
          mobile_number: legacyFaculty.phone
        },
        professional_info: {
          designation: legacyFaculty.designation,
          department: legacyFaculty.department_id,
          specialization: legacyFaculty.specialization,
          date_of_joining: legacyFaculty.joining_date,
          employment_type: legacyFaculty.employment_type
        }
      };
    }
  }

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

export const getAllProfiles = asyncHandler(async (req, res) => {
  // Get all profiles from FacultyProfile collection
  const profiles = await FacultyProfile.find({}).lean();

  // Get all legacy faculty records
  const legacyFaculty = await Faculty.find({}).lean();

  // Create a map of existing profiles by faculty_id
  const profileMap = new Map();
  profiles.forEach(p => {
    profileMap.set(p.faculty_id, {
      faculty_id: p.faculty_id,
      basic_info: p.basic_info,
      contact_info: p.contact_info,
      professional_info: p.professional_info
    });
  });

  // Merge legacy faculty records, transforming them to match profile structure
  legacyFaculty.forEach(f => {
    if (!profileMap.has(f.faculty_id)) {
      profileMap.set(f.faculty_id, {
        faculty_id: f.faculty_id,
        basic_info: {
          full_name: f.name,
          gender: f.gender,
          date_of_birth: f.date_of_birth
        },
        contact_info: {
          email_address: f.email,
          mobile_number: f.phone
        },
        professional_info: {
          designation: f.designation,
          department: f.department_id,
          specialization: f.specialization,
          date_of_joining: f.joining_date,
          employment_type: f.employment_type
        }
      });
    }
  });

  const data = Array.from(profileMap.values());
  res.status(200).json(new ApiResponse(200, data, 'All profiles fetched'));
});

export const createProfile = asyncHandler(async (req, res) => {
  const data = req.body?.profile || req.body || {};
  if (!data.faculty_id) throw new ApiError(400, 'Faculty ID is required');

  const existing = await FacultyProfile.findOne({ faculty_id: data.faculty_id });
  if (existing) throw new ApiError(400, 'Profile already exists for this faculty');

  const doc = await FacultyProfile.create(data);
  res.status(201).json(new ApiResponse(201, { profile: sanitizeProfile(doc) }, 'Profile created'));
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const facultyId = String(req.params.faculty_id || '').trim();
  if (!facultyId) throw new ApiError(400, 'Faculty ID is required');

  // Delete faculty profile
  const profile = await FacultyProfile.findOneAndDelete({ faculty_id: facultyId });
  if (!profile) throw new ApiError(404, 'Profile not found');

  // Delete legacy faculty record
  await Faculty.deleteOne({ faculty_id: facultyId });

  // Delete user record
  await User.deleteOne({ user_id: facultyId });

  // Delete all APAR forms for this faculty
  const { AparForm } = await import('../models/aparForm.model.js');
  await AparForm.deleteMany({ faculty_id: facultyId });

  res.status(200).json(new ApiResponse(200, {}, 'Faculty permanently deleted'));
});
