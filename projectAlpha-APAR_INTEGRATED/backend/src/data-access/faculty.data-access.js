import { Faculty } from '../models/faculty.model.js';
import { User } from '../models/user.model.js';

/**
 * Faculty Data Access Layer
 * Updated to use simplified Faculty model (profile only)
 */

export const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      name,
      gender,
      date_of_birth,
      designation,
      email,
      phone,
      department_id,
      qualification,
      specialization,
      joining_date,
      employment_type
    } = data;

    const newFaculty = new Faculty({
      faculty_id,
      email,
      name,
      gender,
      date_of_birth,
      designation,
      department_id,
      qualification,
      specialization,
      joining_date,
      employment_type,
      phone,
      metadata: {
        created_by: loggedInUser?.userId || loggedInUser?.id || null,
        change_log: [{
          action: 'created',
          user_id: loggedInUser?.userId || loggedInUser?.id || null,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newFaculty.save();
    return mapFaculty(saved);
  } catch (error) {
    console.error("Error creating faculty:", error);
    throw error;
  }
}

// Helper to map Mongoose document to flat structure expected by frontend
const mapFaculty = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;

  return {
    faculty_id: obj.faculty_id,
    email: obj.email,
    role: obj.role,
    name: obj.name,
    gender: obj.gender,
    date_of_birth: obj.date_of_birth,
    designation: obj.designation,
    department_id: obj.department_id,
    qualification: obj.qualification,
    specialization: obj.specialization,
    joining_date: obj.joining_date,
    employment_type: obj.employment_type,
    phone: obj.phone,
    metadata: obj.metadata || {}
  };
};

export const get = async () => {
  try {
    const facultyMembers = await Faculty.find().sort({ name: 1 });
    return facultyMembers.map(mapFaculty);
  } catch (error) {
    console.error("Error fetching faculty list:", error);
    throw error;
  }
}

export const findById = async (facultyId) => {
  try {
    const faculty = await Faculty.findOne({ faculty_id: facultyId });
    return mapFaculty(faculty);
  } catch (error) {
    console.error("Error finding faculty by ID:", error);
    return null;
  }
}

export const findByEmail = async (email) => {
  if (!email) return null;
  try {
    const faculty = await Faculty.findOne({ email: email.trim().toLowerCase() });
    return mapFaculty(faculty);
  } catch (error) {
    console.error("Error finding faculty by email:", error);
    return null;
  }
}

export const getByDepartmentId = async (department_id) => {
  try {
    const facultyMembers = await Faculty.find({ department_id }).sort({ name: 1 });
    return facultyMembers.map(mapFaculty);
  } catch (error) {
    throw error;
  }
}

export const getByDesignation = async (designation) => {
  try {
    const facultyMembers = await Faculty.find({ designation }).sort({ name: 1 });
    return facultyMembers.map(mapFaculty);
  } catch (error) {
    throw error;
  }
}

export const getByEmploymentType = async (employment_type) => {
  try {
    const facultyMembers = await Faculty.find({ employment_type }).sort({ name: 1 });
    return facultyMembers.map(mapFaculty);
  } catch (error) {
    throw error;
  }
}

export const listFacultyIds = async () => {
  const facultyMembers = await Faculty.find({}, { faculty_id: 1 }).sort({ faculty_id: 1 });
  return facultyMembers.map((f) => f.faculty_id);
}

export const update = async (faculty_id, data, loggedInUser = null) => {
  try {
    const {
      name,
      gender,
      date_of_birth,
      designation,
      email,
      phone,
      department_id,
      qualification,
      specialization,
      joining_date,
      employment_type
    } = data;

    const updateFields = {};
    if (email) updateFields.email = email;
    if (name) updateFields.name = name;
    if (gender) updateFields.gender = gender;
    if (date_of_birth) updateFields.date_of_birth = date_of_birth;
    if (designation) updateFields.designation = designation;
    if (department_id) updateFields.department_id = department_id;
    if (qualification) updateFields.qualification = qualification;
    if (specialization) updateFields.specialization = specialization;
    if (joining_date) updateFields.joining_date = joining_date;
    if (employment_type) updateFields.employment_type = employment_type;
    if (phone) updateFields.phone = phone;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { faculty_id },
      {
        $set: updateFields,
        $push: {
          'metadata.change_log': {
            action: 'updated',
            user_id: userId,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (updatedFaculty) {
      const userUpdateFields = {};
      if (name) userUpdateFields.name = name;
      if (designation) userUpdateFields.designation = designation;
      if (department_id) userUpdateFields.department_id = department_id;
      if (email) userUpdateFields.email = email;

      if (Object.keys(userUpdateFields).length > 0) {
        await User.findOneAndUpdate({ user_id: faculty_id }, { $set: userUpdateFields });
      }
    }

    return mapFaculty(updatedFaculty);
  } catch (error) {
    console.error("Error updating faculty:", error);
    throw error;
  }
}

export const deleteFaculty = async (faculty_id) => {
  try {
    await Faculty.findOneAndDelete({ faculty_id });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    throw error;
  }
}

/**
 * Sync APAR form data back to Faculty profile
 * Updates faculty record with relevant information from APAR forms
 * @param {string} faculty_id - The faculty ID
 * @param {object} aparData - The APAR form data containing personal, teaching, research, corporate info
 */
export const syncAparToFaculty = async (faculty_id, aparData) => {
  try {
    if (!faculty_id || !aparData) {
      console.warn("syncAparToFaculty: Missing faculty_id or aparData");
      return null;
    }

    const updateFields = {};

    // Extract personal info from APAR form if available
    const personal = aparData.personal || aparData.formData?.personal;
    if (personal) {
      if (personal.name) updateFields.name = personal.name;
      if (personal.designation) updateFields.designation = personal.designation;
      if (personal.department_id) updateFields.department_id = personal.department_id;
      if (personal.date_of_birth) updateFields.date_of_birth = personal.date_of_birth;
      if (personal.qualification) updateFields.qualification = personal.qualification;
      if (personal.specialization) updateFields.specialization = personal.specialization;
      if (personal.email) updateFields.email = personal.email;
      if (personal.phone) updateFields.phone = personal.phone;
    }

    // Only update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return null;
    }

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { faculty_id },
      { $set: updateFields },
      { new: true }
    );

    return mapFaculty(updatedFaculty);
  } catch (error) {
    console.error("Error syncing APAR to Faculty:", error);
    // Don't throw - let the calling function decide how to handle
    return null;
  }
}