import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * E-Content Developed Data Access Layer
 * Updated to use FacultyActivity collection with type='econtent'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      course_id,
      name_of_module,
      type_of_content,
      platform,
      platform_type,
      date_of_launching,
      academic_year,
      semester,
      target_audience,
      duration_hours,
      learning_outcome,
      remarks,
      link
    } = data;

    // Check for duplicates
    const existingContent = await FacultyActivity.findOne({
      name_of_module: name_of_module,
      course_id: course_id,
      department_id: department_id,
      type: 'econtent'
    });

    if (existingContent) {
      throw new Error(`Duplicate Entry: E-Content module "${name_of_module}" for this course already exists.`);
    }

    const econtent_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new FacultyActivity({
      activity_id: econtent_id,
      econtent_id,
      faculty_id,
      department_id,
      type: 'econtent',
      course_id,
      name_of_module,
      title: name_of_module,
      type_of_content,
      platform,
      platform_type,
      date_of_launching,
      academic_year,
      semester,
      target_audience,
      duration_hours,
      learning_outcome,
      remarks,
      link,
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
      let ay = academic_year;
      if (!ay && date_of_launching) {
        const y = new Date(date_of_launching).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'econtent', ...saved.toObject() };
      triggerAparAutoSyncMultiple([faculty_id], ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformEcontent(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformEcontent = (activity) => ({
  econtent_id: activity.econtent_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  course_id: activity.course_id,
  name_of_module: activity.name_of_module || activity.title,
  type_of_content: activity.type_of_content,
  platform: activity.platform,
  platform_type: activity.platform_type,
  date_of_launching: activity.date_of_launching,
  academic_year: activity.academic_year,
  semester: activity.semester,
  target_audience: activity.target_audience,
  duration_hours: activity.duration_hours,
  learning_outcome: activity.learning_outcome,
  remarks: activity.remarks,
  link: activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'econtent' }).sort({ date_of_launching: -1 });
    return activities.map(a => transformEcontent(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByEcontentId = async (econtent_id) => {
  try {
    const query = { type: 'econtent' };
    if (mongoose.Types.ObjectId.isValid(econtent_id)) {
      query.$or = [{ econtent_id: econtent_id }, { activity_id: econtent_id }, { _id: econtent_id }];
    } else {
      query.$or = [{ econtent_id: econtent_id }, { activity_id: econtent_id }];
    }

    const activity = await FacultyActivity.findOne(query);
    return activity ? transformEcontent(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'econtent' }).sort({ date_of_launching: -1 });
    return activities.map(a => transformEcontent(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'econtent' }).sort({ date_of_launching: -1 });
    return activities.map(a => transformEcontent(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (econtent_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.name_of_module) {
      updateFields.name_of_module = data.name_of_module;
      updateFields.title = data.name_of_module;
    }
    if (data.course_id) updateFields.course_id = data.course_id;
    if (data.type_of_content) updateFields.type_of_content = data.type_of_content;
    if (data.platform) updateFields.platform = data.platform;
    if (data.platform_type) updateFields.platform_type = data.platform_type;
    if (data.date_of_launching) updateFields.date_of_launching = data.date_of_launching;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.semester) updateFields.semester = data.semester;
    if (data.target_audience) updateFields.target_audience = data.target_audience;
    if (data.duration_hours !== undefined) updateFields.duration_hours = data.duration_hours;
    if (data.learning_outcome) updateFields.learning_outcome = data.learning_outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'econtent' };
    if (mongoose.Types.ObjectId.isValid(econtent_id)) {
      query.$or = [{ econtent_id: econtent_id }, { activity_id: econtent_id }, { _id: econtent_id }];
    } else {
      query.$or = [{ econtent_id: econtent_id }, { activity_id: econtent_id }];
    }

    const result = await FacultyActivity.findOneAndUpdate(
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
      let ay = result.academic_year;
      if (!ay && result.date_of_launching) {
        const y = new Date(result.date_of_launching).getFullYear();
        ay = `${y}-${y + 1}`;
      }
      triggerAparAutoSyncMultiple([result.faculty_id], ay, {
        type: 'econtent',
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

const deleteEcontent = async (id) => {
  try {
    const query = { type: 'econtent' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ econtent_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ econtent_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE E-CONTENT] Record not found for ID: ${id}`);
      throw new Error(`E-Content record not found for ID: ${id}`);
    }

    let ay = activity.academic_year;
    if (!ay && activity.date_of_launching) {
      const y = new Date(activity.date_of_launching).getFullYear();
      ay = `${y}-${y + 1}`;
    }
    const entryData = { type: 'econtent', action: 'deleted', ...activity.toObject() };

    await FacultyActivity.findOneAndDelete(query);

    if (activity.faculty_id) {
      triggerAparAutoSyncMultiple([activity.faculty_id], ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByEcontentId, getByDepartmentId, getByFacultyId, update, deleteEcontent }
