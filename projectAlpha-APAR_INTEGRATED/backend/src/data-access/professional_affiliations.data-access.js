import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Professional Affiliations Data Access Layer
 * Updated to use FacultyActivity collection with type='affiliation'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      professional_body_name,
      membership_id,
      type_of_membership,
      position_held,
      level,
      area_of_support,
      start_date,
      end_date,
      academic_year,
      status,
      remarks,
      link
    } = data;

    const affiliation_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new FacultyActivity({
      activity_id: affiliation_id,
      affiliation_id,
      faculty_id,
      department_id,
      type: 'affiliation',
      professional_body_name,
      membership_id,
      type_of_membership,
      position_held,
      level,
      area_of_support,
      start_date,
      end_date,
      academic_year,
      status,
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
      triggerAparAutoSyncMultiple([faculty_id], academic_year, {
        type: 'affiliation',
        ...saved.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformAffiliation(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformAffiliation = (activity) => ({
  affiliation_id: activity.affiliation_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  professional_body_name: activity.professional_body_name,
  membership_id: activity.membership_id,
  type_of_membership: activity.type_of_membership,
  position_held: activity.position_held,
  level: activity.level,
  area_of_support: activity.area_of_support,
  start_date: activity.start_date,
  end_date: activity.end_date,
  academic_year: activity.academic_year,
  status: activity.status,
  remarks: activity.remarks,
  link: activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'affiliation' }).sort({ start_date: -1 });
    return activities.map(a => transformAffiliation(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByAffiliationId = async (affiliation_id) => {
  try {
    const activity = await FacultyActivity.findOne({ affiliation_id, type: 'affiliation' });
    return activity ? transformAffiliation(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'affiliation' }).sort({ start_date: -1 });
    return activities.map(a => transformAffiliation(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'affiliation' }).sort({ start_date: -1 });
    return activities.map(a => transformAffiliation(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (affiliation_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.professional_body_name) updateFields.professional_body_name = data.professional_body_name;
    if (data.membership_id) updateFields.membership_id = data.membership_id;
    if (data.type_of_membership) updateFields.type_of_membership = data.type_of_membership;
    if (data.position_held) updateFields.position_held = data.position_held;
    if (data.level) updateFields.level = data.level;
    if (data.area_of_support) updateFields.area_of_support = data.area_of_support;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.status) updateFields.status = data.status;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await FacultyActivity.findOneAndUpdate(
      { affiliation_id, type: 'affiliation' },
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
        type: 'affiliation',
        action: 'updated',
        ...transformAffiliation(result.toObject())
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteAffiliation = async (id) => {
  try {
    const query = { type: 'affiliation' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ affiliation_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ affiliation_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE AFFILIATION] Record not found for ID: ${id}`);
      throw new Error(`Professional Affiliation record not found for ID: ${id}`);
    }

    const entryData = { type: 'affiliation', action: 'deleted', ...transformAffiliation(activity.toObject()) };

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

export { set, get, getByAffiliationId, getByDepartmentId, getByFacultyId, update, deleteAffiliation }
