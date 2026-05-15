import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Research Innovation Awards Data Access Layer
 * Updated to use FacultyActivity collection with type='award'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      name_of_award,
      department_id,
      faculty_id,
      type_of_award,
      category_of_award,
      level,
      name_of_organisation,
      awarding_agency,
      date_of_award,
      monetary_value,
      year,
      academic_year,
      outcome,
      remarks,
      evidence_link,
      faculty_recipients = [],
      student_recipients = [],
      external_recipients = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_recipients === 'string') {
      try { faculty_recipients = JSON.parse(faculty_recipients); } catch (e) {
        faculty_recipients = [];
      }
    }
    if (typeof student_recipients === 'string') {
      try { student_recipients = JSON.parse(student_recipients); } catch (e) {
        student_recipients = [];
      }
    }
    if (typeof external_recipients === 'string') {
      try { external_recipients = JSON.parse(external_recipients); } catch (e) {
        external_recipients = [];
      }
    }

    // Check for duplicates
    const existingAward = await FacultyActivity.findOne({
      name_of_award: name_of_award,
      year: year,
      department_id: department_id,
      type: 'award'
    });

    if (existingAward) {
      throw new Error(`Duplicate Entry: An award "${name_of_award}" (${year}) already exists.`);
    }

    const award_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new FacultyActivity({
      activity_id: award_id,
      award_id,
      faculty_id,
      department_id,
      type: 'award',
      name_of_award,
      title: name_of_award,
      type_of_award,
      category_of_award,
      level,
      name_of_organisation,
      awarding_agency,
      date_of_award,
      monetary_value,
      year,
      academic_year,
      outcome,
      remarks,
      evidence_link,
      link: evidence_link,
      faculty_recipients,
      student_recipients,
      external_recipients,
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
    const transformed = transformAward(saved.toObject());
    const facultyIds = transformed.faculty_recipients.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      let ay = transformed.academic_year;
      if (!ay && transformed.year) ay = `${transformed.year}-${transformed.year + 1}`;
      if (!ay && transformed.date_of_award) {
        const y = new Date(transformed.date_of_award).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'award', ...transformed };
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

const transformAward = (activity) => ({
  award_id: activity.award_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  name_of_award: activity.name_of_award || activity.title,
  type_of_award: activity.type_of_award,
  category_of_award: activity.category_of_award,
  level: activity.level,
  name_of_organisation: activity.name_of_organisation,
  awarding_agency: activity.awarding_agency,
  date_of_award: activity.date_of_award,
  monetary_value: activity.monetary_value,
  year: activity.year,
  academic_year: activity.academic_year,
  outcome: activity.outcome,
  remarks: activity.remarks,
  evidence_link: activity.evidence_link || activity.link,
  faculty_recipients: activity.faculty_recipients || [],
  student_recipients: activity.student_recipients || [],
  external_recipients: activity.external_recipients || [],
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'award' }).sort({ year: -1, date_of_award: -1 });
    return activities.map(a => transformAward(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByAwardId = async (award_id) => {
  try {
    const activity = await FacultyActivity.findOne({ award_id, type: 'award' });
    return activity ? transformAward(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'award' }).sort({ year: -1 });
    return activities.map(a => transformAward(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'award' }).sort({ year: -1 });
    return activities.map(a => transformAward(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (award_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.name_of_award) {
      updateFields.name_of_award = data.name_of_award;
      updateFields.title = data.name_of_award;
    }
    if (data.type_of_award) updateFields.type_of_award = data.type_of_award;
    if (data.category_of_award) updateFields.category_of_award = data.category_of_award;
    if (data.level) updateFields.level = data.level;
    if (data.name_of_organisation) updateFields.name_of_organisation = data.name_of_organisation;
    if (data.awarding_agency) updateFields.awarding_agency = data.awarding_agency;
    if (data.date_of_award) updateFields.date_of_award = data.date_of_award;
    if (data.monetary_value !== undefined) updateFields.monetary_value = data.monetary_value;
    if (data.year) updateFields.year = data.year;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.evidence_link) {
      updateFields.evidence_link = data.evidence_link;
      updateFields.link = data.evidence_link;
    }
    if (data.external_recipients) {
      let extRecipients = data.external_recipients;
      if (typeof extRecipients === 'string') {
        try { extRecipients = JSON.parse(extRecipients); } catch (e) { extRecipients = []; }
      }
      updateFields.external_recipients = extRecipients;
    }
    if (data.faculty_recipients) {
      let fRecipients = data.faculty_recipients;
      if (typeof fRecipients === 'string') {
        try { fRecipients = JSON.parse(fRecipients); } catch (e) { fRecipients = []; }
      }
      if (Array.isArray(fRecipients)) {
        updateFields.faculty_recipients = fRecipients.map(f => ({ faculty_id: f.faculty_id || f }));
      }
    }
    if (data.student_recipients) {
      let sRecipients = data.student_recipients;
      if (typeof sRecipients === 'string') {
        try { sRecipients = JSON.parse(sRecipients); } catch (e) { sRecipients = []; }
      }
      if (Array.isArray(sRecipients)) {
        updateFields.student_recipients = sRecipients.map(s => ({ student_id: s.student_id || s }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await FacultyActivity.findOneAndUpdate(
      { award_id, type: 'award' },
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
      const transformed = transformAward(result.toObject());
      const facultyIds = transformed.faculty_recipients.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.year) ay = `${transformed.year}-${transformed.year + 1}`;
        if (!ay && transformed.date_of_award) {
          const y = new Date(transformed.date_of_award).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'award',
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

const deleteAward = async (id) => {
  try {
    const query = { type: 'award' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ award_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ award_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE AWARD] Award not found for ID: ${id}`);
      throw new Error(`Award record not found for ID: ${id}`);
    }

    const transformed = transformAward(activity.toObject());
    const facultyIds = transformed.faculty_recipients.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.academic_year;
    if (!ay && transformed.year) ay = `${transformed.year}-${transformed.year + 1}`;
    if (!ay && transformed.date_of_award) {
      const y = new Date(transformed.date_of_award).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'award', action: 'deleted', ...transformed };

    await FacultyActivity.findOneAndDelete(query);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByAwardId, getByDepartmentId, getByFacultyId, update, deleteAward }