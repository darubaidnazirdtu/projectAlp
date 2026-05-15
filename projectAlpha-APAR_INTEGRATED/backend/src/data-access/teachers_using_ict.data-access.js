import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Teachers Using ICT Data Access Layer
 * Updated to use FacultyActivity collection with type='ict'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      faculty_name,
      ict_classroom_rooms,
      course_name,
      academic_year,
      semester,
      ict_mode,
      ict_tools_used,
      e_resources_and_techniques_used,
      no_of_ict_enabled_classrooms,
      impact,
      remarks,
      evidence_link
    } = data;

    const ict_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    // Parse ict_tools_used if string
    let toolsArray = ict_tools_used;
    if (typeof ict_tools_used === 'string') {
      toolsArray = ict_tools_used.split(',').map(s => s.trim()).filter(s => s);
    }

    const newActivity = new FacultyActivity({
      activity_id: ict_id,
      ict_id,
      faculty_id,
      faculty_name,
      department_id,
      type: 'ict',
      course_name,
      academic_year,
      semester,
      ict_mode,
      ict_tools_used: toolsArray,
      ict_classroom_rooms: Array.isArray(ict_classroom_rooms) ? ict_classroom_rooms : (typeof ict_classroom_rooms === 'string' ? ict_classroom_rooms.split(',').map(s=>s.trim()).filter(s=>s) : []),
      e_resources_and_techniques_used,
      no_of_ict_enabled_classrooms,
      impact,
      remarks,
      evidence_link,
      link: evidence_link,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newActivity.save();

    // Trigger auto-sync
    if (faculty_id) {
      triggerAparAutoSyncMultiple([faculty_id], academic_year, {
        type: 'ict',
        ...saved.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformIct(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformIct = (activity) => ({
  ict_id: activity.ict_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  faculty_name: activity.faculty_name,
  department_id: activity.department_id,
  course_name: activity.course_name,
  academic_year: activity.academic_year,
  semester: activity.semester,
  ict_mode: activity.ict_mode,
  ict_tools_used: activity.ict_tools_used || [],
  ict_classroom_rooms: activity.ict_classroom_rooms || [],
  e_resources_and_techniques_used: activity.e_resources_and_techniques_used,
  no_of_ict_enabled_classrooms: activity.no_of_ict_enabled_classrooms,
  impact: activity.impact,
  remarks: activity.remarks,
  evidence_link: activity.evidence_link || activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'ict' }).sort({ academic_year: -1 });
    return activities.map(a => transformIct(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByIctId = async (ict_id) => {
  try {
    const activity = await FacultyActivity.findOne({ ict_id, type: 'ict' });
    return activity ? transformIct(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'ict' }).sort({ academic_year: -1 });
    return activities.map(a => transformIct(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'ict' }).sort({ academic_year: -1 });
    return activities.map(a => transformIct(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (ict_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.course_name) updateFields.course_name = data.course_name;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.semester) updateFields.semester = data.semester;
    if (data.ict_mode) updateFields.ict_mode = data.ict_mode;
    if (data.ict_tools_used) {
      let toolsArray = data.ict_tools_used;
      if (typeof data.ict_tools_used === 'string') {
        toolsArray = data.ict_tools_used.split(',').map(s => s.trim()).filter(s => s);
      }
      updateFields.ict_tools_used = toolsArray;
    }
    if (data.faculty_name) updateFields.faculty_name = data.faculty_name;
    if (data.ict_classroom_rooms) {
      updateFields.ict_classroom_rooms = Array.isArray(data.ict_classroom_rooms) ? data.ict_classroom_rooms : (typeof data.ict_classroom_rooms === 'string' ? data.ict_classroom_rooms.split(',').map(s=>s.trim()).filter(s=>s) : []);
    }
    if (data.e_resources_and_techniques_used) updateFields.e_resources_and_techniques_used = data.e_resources_and_techniques_used;
    if (data.no_of_ict_enabled_classrooms !== undefined) updateFields.no_of_ict_enabled_classrooms = data.no_of_ict_enabled_classrooms;
    if (data.impact) updateFields.impact = data.impact;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.evidence_link) {
      updateFields.evidence_link = data.evidence_link;
      updateFields.link = data.evidence_link;
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await FacultyActivity.findOneAndUpdate(
      { ict_id, type: 'ict' },
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
        type: 'ict',
        action: 'updated',
        ...transformIct(result.toObject())
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteIct = async (id) => {
  try {
    const query = { type: 'ict' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ ict_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ ict_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE ICT] Record not found for ID: ${id}`);
      throw new Error(`ICT Tool record not found for ID: ${id}`);
    }

    const entryData = { type: 'ict', action: 'deleted', ...transformIct(activity.toObject()) };

    await FacultyActivity.findOneAndDelete(query);

    if (activity.faculty_id) {
      triggerAparAutoSyncMultiple([activity.faculty_id], activity.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByIctId, getByDepartmentId, getByFacultyId, update, deleteIct }