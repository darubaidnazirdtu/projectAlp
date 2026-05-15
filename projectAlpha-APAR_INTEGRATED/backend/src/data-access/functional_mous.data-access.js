import { Collaboration } from "../models/collaboration.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Functional MOUs Data Access Layer
 * Updated to use Collaboration collection with type='mou'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      organisation_name,
      type_of_mou,
      level,
      start_date,
      end_date,
      year_of_signing,
      duration,
      purpose,
      activities_under_mou,
      funding_amount,
      academic_year,
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
    // Normalize activities_under_mou: accept JSON array or single string
    if (typeof activities_under_mou === 'string') {
      try {
        activities_under_mou = JSON.parse(activities_under_mou);
      } catch (e) {
        // wrap single string into array with title
        activities_under_mou = [{ activity_title: activities_under_mou }];
      }
    }

    const mou_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newCollab = new Collaboration({
      collaboration_id: mou_id,
      mou_id,
      department_id,
      type: 'mou',
      organisation_name,
      title: organisation_name,
      type_of_mou,
      level,
      start_date,
      end_date,
      year_of_signing,
      year: year_of_signing,
      duration,
      purpose,
      activities_under_mou,
      funding_amount,
      academic_year,
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
    const transformed = transformMou(saved.toObject());
    const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      // Prioritize academic year, then year of signing, then start date year
      let ay = transformed.academic_year;
      if (!ay && transformed.year_of_signing) ay = `${transformed.year_of_signing}-${transformed.year_of_signing + 1}`;
      if (!ay && transformed.start_date) {
        const y = new Date(transformed.start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'mou', ...transformed };
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

const transformMou = (collab) => ({
  mou_id: collab.mou_id || collab.collaboration_id,
  department_id: collab.department_id,
  organisation_name: collab.organisation_name || collab.title,
  type_of_mou: collab.type_of_mou,
  level: collab.level,
  start_date: collab.start_date,
  end_date: collab.end_date,
  year_of_signing: collab.year_of_signing || collab.year,
  duration: collab.duration,
  purpose: collab.purpose,
  activities_under_mou: collab.activities_under_mou,
  funding_amount: collab.funding_amount,
  academic_year: collab.academic_year,
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
    const collabs = await Collaboration.find({ type: 'mou' }).sort({ year_of_signing: -1 });
    return collabs.map(c => transformMou(c.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByMouId = async (mou_id) => {
  try {
    const collab = await Collaboration.findOne({ mou_id, type: 'mou' });
    return collab ? transformMou(collab.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const collabs = await Collaboration.find({ department_id, type: 'mou' }).sort({ year_of_signing: -1 });
    return collabs.map(c => transformMou(c.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (mou_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.organisation_name) {
      updateFields.organisation_name = data.organisation_name;
      updateFields.title = data.organisation_name;
    }
    if (data.type_of_mou) updateFields.type_of_mou = data.type_of_mou;
    if (data.level) updateFields.level = data.level;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.year_of_signing) {
      updateFields.year_of_signing = data.year_of_signing;
      updateFields.year = data.year_of_signing;
    }
    if (data.duration) updateFields.duration = data.duration;
    if (data.purpose) updateFields.purpose = data.purpose;
    if (data.activities_under_mou) {
      let acts = data.activities_under_mou;
      if (typeof acts === 'string') {
        try { acts = JSON.parse(acts); } catch (e) { acts = [{ activity_title: acts }]; }
      }
      updateFields.activities_under_mou = acts;
    }
    if (data.funding_amount !== undefined) updateFields.funding_amount = data.funding_amount;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
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

    const result = await Collaboration.findOneAndUpdate(
      { mou_id, type: 'mou' },
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
      const transformed = transformMou(result.toObject());
      const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.year_of_signing) ay = `${transformed.year_of_signing}-${transformed.year_of_signing + 1}`;
        if (!ay && transformed.start_date) {
          const y = new Date(transformed.start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'mou',
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

const deleteMou = async (id) => {
  try {
    const query = { type: 'mou' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ mou_id: id }, { collaboration_id: id }, { _id: id }];
    } else {
      query.$or = [{ mou_id: id }, { collaboration_id: id }];
    }

    const collab = await Collaboration.findOne(query);
    if (!collab) {
      console.warn(`[DELETE MOU] Record not found for ID: ${id}`);
      throw new Error(`MoU record not found for ID: ${id}`);
    }

    const transformed = transformMou(collab.toObject());
    // Correct identifier for MOUs is also faculty_associations
    const facultyIds = transformed.faculty_associations.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.academic_year;
    if (!ay && transformed.year_of_signing) ay = `${transformed.year_of_signing}-${transformed.year_of_signing + 1}`;
    if (!ay && transformed.start_date) {
      const y = new Date(transformed.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'mou', action: 'deleted', ...transformed };

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

export { set, get, getByMouId, getByDepartmentId, update, deleteMou }