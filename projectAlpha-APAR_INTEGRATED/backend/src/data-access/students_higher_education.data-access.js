import { StudentActivity } from "../models/studentActivity.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Students Higher Education Data Access Layer
 * Updated to use StudentActivity collection with type='higher_ed'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      student_id,
      department_id,
      student_name,
      institution_joined,
      country,
      level_of_study,
      programme_type,
      details_of_programme,
      mentor_name,
      academic_year,
      year_of_joining,
      current_status,
      remarks,
      link
    } = data;

    const record_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new StudentActivity({
      activity_id: record_id,
      record_id,
      student_id,
      department_id,
      type: 'higher_ed',
      student_name,
      institution_joined,
      country,
      level_of_study,
      programme_type,
      details_of_programme,
      mentor_name,
      academic_year,
      year_of_joining,
      current_status,
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
    return transformHigherEd(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformHigherEd = (activity) => ({
  record_id: activity.record_id || activity.activity_id,
  student_id: activity.student_id,
  department_id: activity.department_id,
  student_name: activity.student_name,
  institution_joined: activity.institution_joined,
  country: activity.country,
  level_of_study: activity.level_of_study,
  programme_type: activity.programme_type,
  details_of_programme: activity.details_of_programme,
  mentor_name: activity.mentor_name,
  academic_year: activity.academic_year,
  year_of_joining: activity.year_of_joining,
  current_status: activity.current_status,
  remarks: activity.remarks,
  link: activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await StudentActivity.find({ type: 'higher_ed' }).sort({ year_of_joining: -1 });
    return activities.map(a => transformHigherEd(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByRecordId = async (record_id) => {
  try {
    const activity = await StudentActivity.findOne({ record_id, type: 'higher_ed' });
    return activity ? transformHigherEd(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await StudentActivity.find({ department_id, type: 'higher_ed' }).sort({ year_of_joining: -1 });
    return activities.map(a => transformHigherEd(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByStudentId = async (student_id) => {
  try {
    const activities = await StudentActivity.find({ student_id, type: 'higher_ed' }).sort({ year_of_joining: -1 });
    return activities.map(a => transformHigherEd(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (record_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.student_id) updateFields.student_id = data.student_id;
    if (data.student_name) updateFields.student_name = data.student_name;
    if (data.institution_joined) updateFields.institution_joined = data.institution_joined;
    if (data.country) updateFields.country = data.country;
    if (data.level_of_study) updateFields.level_of_study = data.level_of_study;
    if (data.programme_type) updateFields.programme_type = data.programme_type;
    if (data.details_of_programme) updateFields.details_of_programme = data.details_of_programme;
    if (data.mentor_name) updateFields.mentor_name = data.mentor_name;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.year_of_joining) updateFields.year_of_joining = data.year_of_joining;
    if (data.current_status) updateFields.current_status = data.current_status;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await StudentActivity.findOneAndUpdate(
      { record_id, type: 'higher_ed' },
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

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteRecord = async (record_id) => {
  try {
    await StudentActivity.findOneAndDelete({ record_id, type: 'higher_ed' });
  } catch (error) {
    throw error;
  }
}

export { set, get, getByRecordId, getByDepartmentId, getByStudentId, update, deleteRecord }