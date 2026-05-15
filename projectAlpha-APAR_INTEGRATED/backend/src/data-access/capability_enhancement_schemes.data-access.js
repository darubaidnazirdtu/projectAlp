import { Training } from "../models/training.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Capability Enhancement Schemes Data Access Layer
 * Updated to use Training collection with type='capability'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      name_of_scheme,
      type_of_scheme,
      academic_year,
      semester,
      start_date,
      end_date,
      no_of_students_enrolled,
      name_of_agencies_involved,
      mode,
      outcome,
      remarks,
      link,
      faculty_ids = [],
      student_ids = [],
      external_contributors = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_ids === 'string') {
      try { faculty_ids = JSON.parse(faculty_ids); } catch (e) {
        faculty_ids = [];
      }
    }
    if (typeof student_ids === 'string') {
      try { student_ids = JSON.parse(student_ids); } catch (e) {
        student_ids = [];
      }
    }
    if (typeof external_contributors === 'string') {
      try { external_contributors = JSON.parse(external_contributors); } catch (e) {
        external_contributors = [];
      }
    }

    const scheme_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newTraining = new Training({
      training_id: scheme_id,
      scheme_id,
      department_id,
      type: 'capability',
      title: name_of_scheme,
      name_of_scheme,
      type_of_scheme,
      type_of_training: type_of_scheme,
      academic_year,
      semester,
      start_date,
      end_date,
      no_of_students_enrolled,
      name_of_agencies_involved,
      mode,
      outcome,
      remarks,
      link,
      faculty_ids,
      student_ids,
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

    const saved = await newTraining.save();

    // Trigger auto-sync
    const transformed = transformCapability(saved.toObject());
    const facultyIds = transformed.faculty_ids || [];
    if (facultyIds.length > 0) {
      let ay = transformed.academic_year;
      if (!ay && transformed.start_date) {
        const y = new Date(transformed.start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'capability', ...transformed };
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

const transformCapability = (training) => ({
  scheme_id: training.scheme_id || training.training_id,
  department_id: training.department_id,
  name_of_scheme: training.name_of_scheme || training.title,
  type_of_scheme: training.type_of_scheme || training.type_of_training,
  academic_year: training.academic_year,
  semester: training.semester,
  start_date: training.start_date,
  end_date: training.end_date,
  no_of_students_enrolled: training.no_of_students_enrolled,
  name_of_agencies_involved: training.name_of_agencies_involved,
  mode: training.mode,
  outcome: training.outcome,
  remarks: training.remarks,
  link: training.link,
  faculty_ids: training.faculty_ids || [],
  student_ids: training.student_ids || [],
  external_contributors: training.external_contributors || [],
  metadata: training.metadata || {}
});

const get = async () => {
  try {
    const trainings = await Training.find({ type: 'capability' }).sort({ academic_year: -1 });
    return trainings.map(t => transformCapability(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const getBySchemeId = async (scheme_id) => {
  try {
    const training = await Training.findOne({ scheme_id, type: 'capability' });
    return training ? transformCapability(training.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const trainings = await Training.find({ department_id, type: 'capability' }).sort({ academic_year: -1 });
    return trainings.map(t => transformCapability(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (scheme_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_scheme) {
      updateFields.name_of_scheme = data.name_of_scheme;
      updateFields.title = data.name_of_scheme;
    }
    if (data.type_of_scheme) {
      updateFields.type_of_scheme = data.type_of_scheme;
      updateFields.type_of_training = data.type_of_scheme;
    }
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.semester) updateFields.semester = data.semester;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.no_of_students_enrolled !== undefined) updateFields.no_of_students_enrolled = data.no_of_students_enrolled;
    if (data.name_of_agencies_involved) updateFields.name_of_agencies_involved = data.name_of_agencies_involved;
    if (data.mode) updateFields.mode = data.mode;
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
    if (data.faculty_ids) {
      let fIds = data.faculty_ids;
      if (typeof fIds === 'string') {
        try { fIds = JSON.parse(fIds); } catch (e) { fIds = []; }
      }
      if (Array.isArray(fIds)) {
        updateFields.faculty_ids = fIds;
      }
    }
    if (data.student_ids) {
      let sIds = data.student_ids;
      if (typeof sIds === 'string') {
        try { sIds = JSON.parse(sIds); } catch (e) { sIds = []; }
      }
      if (Array.isArray(sIds)) {
        updateFields.student_ids = sIds;
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Training.findOneAndUpdate(
      { scheme_id, type: 'capability' },
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
      const transformed = transformCapability(result.toObject());
      const facultyIds = transformed.faculty_ids || [];
      if (facultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.start_date) {
          const y = new Date(transformed.start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'capability',
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

const deleteScheme = async (id) => {
  try {
    const query = { type: 'capability' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ scheme_id: id }, { training_record_id: id }, { _id: id }];
    } else {
      query.$or = [{ scheme_id: id }, { training_record_id: id }];
    }

    const training = await Training.findOne(query);
    if (!training) {
      console.warn(`[DELETE SCHEME] Record not found for ID: ${id}`);
      throw new Error(`Capability Scheme record not found for ID: ${id}`);
    }

    const transformed = transformCapability(training.toObject());
    const facultyIds = transformed.faculty_ids || [];

    let ay = transformed.academic_year;
    if (!ay && transformed.start_date) {
      const y = new Date(transformed.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'capability', action: 'deleted', ...transformed };

    await Training.findOneAndDelete(query);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getBySchemeId, getByDepartmentId, update, deleteScheme }