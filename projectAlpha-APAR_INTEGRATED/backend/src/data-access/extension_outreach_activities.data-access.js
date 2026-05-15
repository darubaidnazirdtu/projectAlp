import { Collaboration } from "../models/collaboration.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Extension Outreach Activities Data Access Layer
 * Updated to use Collaboration collection with type='outreach'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      title_of_activity,
      type_of_activity,
      start_date,
      end_date,
      location,
      geo_tag_location_link,
      academic_year,
      no_of_participants,
      target_beneficiaries,
      sponsoring_agency,
      outcome,
      remarks,
      link,
      faculty_associations = [],
      student_associations = [],
      external_contributors = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_associations === 'string') {
      try { faculty_associations = JSON.parse(faculty_associations); } catch (e) {
        faculty_associations = [];
      }
    }
    if (typeof student_associations === 'string') {
      try { student_associations = JSON.parse(student_associations); } catch (e) {
        student_associations = [];
      }
    }
    if (typeof external_contributors === 'string') {
      try { external_contributors = JSON.parse(external_contributors); } catch (e) {
        external_contributors = [];
      }
    }

    const activity_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newCollab = new Collaboration({
      collaboration_id: activity_id,
      activity_id,
      department_id,
      type: 'outreach',
      title_of_activity,
      title: title_of_activity,
      type_of_activity,
      start_date,
      end_date,
      location,
      geo_tag_location_link,
      academic_year,
      no_of_participants,
      number_of_participants: no_of_participants,
      target_beneficiaries,
      sponsoring_agency,
      outcome,
      remarks,
      link,
      faculty_associations,
      student_associations,
      external_contributors,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newCollab.save();

    // Trigger auto-sync
    const transformed = transformOutreach(saved.toObject());
    const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      let ay = transformed.academic_year;
      if (!ay && transformed.start_date) {
        const y = new Date(transformed.start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'outreach', ...transformed };
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformed;

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformOutreach = (collab) => ({
  activity_id: collab.activity_id || collab.collaboration_id,
  department_id: collab.department_id,
  title_of_activity: collab.title_of_activity || collab.title,
  type_of_activity: collab.type_of_activity,
  start_date: collab.start_date,
  end_date: collab.end_date,
  location: collab.location,
  geo_tag_location_link: collab.geo_tag_location_link,
  academic_year: collab.academic_year,
  no_of_participants: collab.no_of_participants || collab.number_of_participants,
  target_beneficiaries: collab.target_beneficiaries,
  sponsoring_agency: collab.sponsoring_agency,
  outcome: collab.outcome,
  remarks: collab.remarks,
  link: collab.link,
  faculty_associations: collab.faculty_associations || [],
  student_associations: collab.student_associations || [],
  external_contributors: collab.external_contributors || [],
  metadata: collab.metadata || {}
});

const get = async () => {
  try {
    const collabs = await Collaboration.find({ type: 'outreach' }).sort({ start_date: -1 });
    return collabs.map(c => transformOutreach(c.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByActivityId = async (activity_id) => {
  try {
    const collab = await Collaboration.findOne({ activity_id, type: 'outreach' });
    return collab ? transformOutreach(collab.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const collabs = await Collaboration.find({ department_id, type: 'outreach' }).sort({ start_date: -1 });
    return collabs.map(c => transformOutreach(c.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (activity_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.title_of_activity) {
      updateFields.title_of_activity = data.title_of_activity;
      updateFields.title = data.title_of_activity;
    }
    if (data.type_of_activity) updateFields.type_of_activity = data.type_of_activity;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.location) updateFields.location = data.location;
    if (data.geo_tag_location_link) updateFields.geo_tag_location_link = data.geo_tag_location_link;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.no_of_participants !== undefined) {
      updateFields.no_of_participants = data.no_of_participants;
      updateFields.number_of_participants = data.no_of_participants;
    }
    if (data.target_beneficiaries) updateFields.target_beneficiaries = data.target_beneficiaries;
    if (data.sponsoring_agency) updateFields.sponsoring_agency = data.sponsoring_agency;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.link) updateFields.link = data.link;
    if (data.external_contributors) {
      let extContributors = data.external_contributors;
      if (typeof extContributors === 'string') {
        try { extContributors = JSON.parse(extContributors); } catch (e) { extContributors = []; }
      }
      updateFields.external_contributors = extContributors;
    }
    if (data.faculty_associations) {
      let fAssoc = data.faculty_associations;
      if (typeof fAssoc === 'string') {
        try { fAssoc = JSON.parse(fAssoc); } catch (e) { fAssoc = []; }
      }
      if (Array.isArray(fAssoc)) {
        updateFields.faculty_associations = fAssoc.map(f => ({ faculty_id: f.faculty_id || f }));
      }
    }
    if (data.student_associations) {
      let sAssoc = data.student_associations;
      if (typeof sAssoc === 'string') {
        try { sAssoc = JSON.parse(sAssoc); } catch (e) { sAssoc = []; }
      }
      if (Array.isArray(sAssoc)) {
        updateFields.student_associations = sAssoc.map(s => ({ student_id: s.student_id || s }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'outreach' };
    if (mongoose.Types.ObjectId.isValid(activity_id)) {
      query.$or = [{ activity_id: activity_id }, { collaboration_id: activity_id }, { _id: activity_id }];
    } else {
      query.$or = [{ activity_id: activity_id }, { collaboration_id: activity_id }];
    }

    const result = await Collaboration.findOneAndUpdate(
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
    if (result) {
      const transformed = transformOutreach(result.toObject());
      const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.start_date) {
          const y = new Date(transformed.start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'outreach',
          action: 'updated',
          ...transformed
        }).catch(err =>
          console.error('Auto-sync trigger failed:', err)
        );
      }
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteOutreach = async (id) => {
  try {
    const query = { type: 'outreach' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ activity_id: id }, { collaboration_id: id }, { _id: id }];
    } else {
      query.$or = [{ activity_id: id }, { collaboration_id: id }];
    }

    const activity = await Collaboration.findOne(query);
    if (!activity) {
      console.warn(`[DELETE OUTREACH] Record not found for ID: ${id}`);
      throw new Error(`Outreach/Extension Activity record not found for ID: ${id}`);
    }

    const transformed = transformOutreach(activity.toObject());
    const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.academic_year;
    if (!ay && transformed.start_date) {
      const y = new Date(transformed.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'outreach', action: 'deleted', ...transformed };

    await Collaboration.findOneAndDelete(query);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByActivityId, getByDepartmentId, update, deleteOutreach }