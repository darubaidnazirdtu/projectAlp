import { Teaching } from "../models/teaching.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Student Centric Methods Data Access Layer
 * Updated to use separate Teaching collection
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      course_id,
      programme_id,
      method_type,
      level,
      academic_year,
      semester,
      details_of_methods,
      course_name,
      course_code,
      programme_name,
      assessment_method,
      outcome,
      remarks,
      evidence_link
    } = data;

    const method_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newTeaching = new Teaching({
      method_id,
      department_id,
      course_id,
      programme_id,
      faculty_id,
      method_type,
      level,
      academic_year,
      semester,
      details_of_methods,
      course_name,
      course_code,
      programme_name,
      assessment_method,
      outcome,
      remarks,
      evidence_link,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newTeaching.save();

    // Trigger auto-sync
    if (faculty_id) {
      triggerAparAutoSyncMultiple([faculty_id], academic_year, {
        type: 'teaching_method',
        ...saved.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return saved.toObject();

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const get = async () => {
  try {
    const methods = await Teaching.find().sort({ academic_year: -1 });
    return methods.map(m => m.toObject());
  } catch (error) {
    throw error;
  }
}

const getByMethodId = async (method_id) => {
  try {
    const method = await Teaching.findOne({ method_id });
    return method ? method.toObject() : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const methods = await Teaching.find({ department_id }).sort({ academic_year: -1 });
    return methods.map(m => m.toObject());
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const methods = await Teaching.find({ faculty_id }).sort({ academic_year: -1 });
    return methods.map(m => m.toObject());
  } catch (error) {
    throw error;
  }
}

const getByCourseId = async (course_id) => {
  try {
    const methods = await Teaching.find({ course_id }).sort({ academic_year: -1 });
    return methods.map(m => m.toObject());
  } catch (error) {
    throw error;
  }
}

const update = async (method_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.course_id) updateFields.course_id = data.course_id;
    if (data.programme_id) updateFields.programme_id = data.programme_id;
    if (data.method_type) updateFields.method_type = data.method_type;
    if (data.level) updateFields.level = data.level;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.semester) updateFields.semester = data.semester;
    if (data.details_of_methods) updateFields.details_of_methods = data.details_of_methods;
    if (data.course_name) updateFields.course_name = data.course_name;
    if (data.course_code) updateFields.course_code = data.course_code;
    if (data.programme_name) updateFields.programme_name = data.programme_name;
    if (data.assessment_method) updateFields.assessment_method = data.assessment_method;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.evidence_link) updateFields.evidence_link = data.evidence_link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = {};
    if (mongoose.Types.ObjectId.isValid(method_id)) {
      query.$or = [{ method_id: method_id }, { _id: method_id }];
    } else {
      query.method_id = method_id;
    }

    const result = await Teaching.findOneAndUpdate(
      query,
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

    // Trigger auto-sync
    if (result && result.faculty_id) {
      triggerAparAutoSyncMultiple([result.faculty_id], result.academic_year, {
        type: 'teaching_method',
        action: 'updated',
        ...result.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteMethod = async (id) => {
  try {
    const query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ method_id: id }, { _id: id }];
    } else {
      query.method_id = id;
    }

    const method = await Teaching.findOne(query);
    if (!method) {
      console.warn(`[DELETE METHOD] Record not found for ID: ${id}`);
      throw new Error(`Teaching Method record not found for ID: ${id}`);
    }

    const entryData = { type: 'teaching_method', action: 'deleted', ...method.toObject() };

    await Teaching.findOneAndDelete(query);

    if (method.faculty_id) {
      triggerAparAutoSyncMultiple([method.faculty_id], method.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByMethodId, getByDepartmentId, getByFacultyId, getByCourseId, update, deleteMethod }