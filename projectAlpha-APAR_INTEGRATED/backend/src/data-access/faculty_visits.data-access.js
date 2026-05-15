import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Faculty Visits Data Access Layer
 * Updated to use FacultyActivity collection with type='visit'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      organisation_name,
      title,
      visit_type,
      purpose,
      location,
      level,
      funding_agency,
      start_date,
      end_date,
      academic_year,
      outcome,
      remarks,
      link
    } = data;

    // Check for duplicates
    const existingVisit = await FacultyActivity.findOne({
      title: title,
      faculty_id: faculty_id,
      start_date: start_date,
      type: 'visit'
    });

    if (existingVisit) {
      throw new Error(`Duplicate Entry: A visit titled "${title}" on ${start_date} already exists.`);
    }

    const visit_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new FacultyActivity({
      activity_id: visit_id,
      visit_id,
      faculty_id,
      department_id,
      type: 'visit',
      organisation_name,
      title,
      visit_type,
      purpose,
      location,
      level,
      funding_agency,
      start_date,
      end_date,
      academic_year,
      outcome,
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
      if (!ay && start_date) {
        const y = new Date(start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'visit', ...saved.toObject() };
      triggerAparAutoSyncMultiple([faculty_id], ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformVisit(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformVisit = (activity) => ({
  visit_id: activity.visit_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  organisation_name: activity.organisation_name,
  title: activity.title,
  visit_type: activity.visit_type,
  purpose: activity.purpose,
  location: activity.location,
  level: activity.level,
  funding_agency: activity.funding_agency,
  start_date: activity.start_date,
  end_date: activity.end_date,
  academic_year: activity.academic_year,
  outcome: activity.outcome,
  remarks: activity.remarks,
  link: activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'visit' }).sort({ start_date: -1 });
    return activities.map(a => transformVisit(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByVisitId = async (visit_id) => {
  try {
    const activity = await FacultyActivity.findOne({ visit_id, type: 'visit' });
    return activity ? transformVisit(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'visit' }).sort({ start_date: -1 });
    return activities.map(a => transformVisit(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'visit' }).sort({ start_date: -1 });
    return activities.map(a => transformVisit(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (visit_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.organisation_name) updateFields.organisation_name = data.organisation_name;
    if (data.title) updateFields.title = data.title;
    if (data.visit_type) updateFields.visit_type = data.visit_type;
    if (data.purpose) updateFields.purpose = data.purpose;
    if (data.location) updateFields.location = data.location;
    if (data.level) updateFields.level = data.level;
    if (data.funding_agency) updateFields.funding_agency = data.funding_agency;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await FacultyActivity.findOneAndUpdate(
      { visit_id, type: 'visit' },
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
      if (!ay && result.start_date) {
        const y = new Date(result.start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }
      triggerAparAutoSyncMultiple([result.faculty_id], ay, {
        type: 'visit',
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

const deleteVisit = async (id) => {
  try {
    const query = { type: 'visit' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ visit_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ visit_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE VISIT] Record not found for ID: ${id}`);
      throw new Error(`Faculty Visit record not found for ID: ${id}`);
    }

    let ay = activity.academic_year;
    if (!ay && activity.start_date) {
      const y = new Date(activity.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }
    const entryData = { type: 'visit', action: 'deleted', ...activity.toObject() };

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

export { set, get, getByVisitId, getByDepartmentId, getByFacultyId, update, deleteVisit }