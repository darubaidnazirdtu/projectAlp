import { Training } from "../models/training.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Professional Staff Training Data Access Layer
 * Updated to use Training collection with type='professional'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      title_of_event,
      type_of_training,
      mode,
      year_of_training,
      academic_year,
      start_date,
      end_date,
      number_of_participants,
      sponsoring_agencies,
      outcome,
      remarks,
      link,
      faculty_participants = [],
      student_participants = [],
      external_participants = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_participants === 'string') {
      try { faculty_participants = JSON.parse(faculty_participants); } catch (e) {
        faculty_participants = [];
      }
    }
    if (typeof student_participants === 'string') {
      try { student_participants = JSON.parse(student_participants); } catch (e) {
        student_participants = [];
      }
    }
    if (typeof external_participants === 'string') {
      try { external_participants = JSON.parse(external_participants); } catch (e) {
        external_participants = [];
      }
    }

    const training_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newTraining = new Training({
      training_id,
      department_id,
      type: 'professional',
      title: title_of_event,
      title_of_event,
      type_of_training,
      mode,
      year_of_training,
      academic_year,
      start_date,
      end_date,
      number_of_participants,
      sponsoring_agencies,
      outcome,
      remarks,
      link,
      faculty_participants,
      student_participants,
      external_participants,
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
    const transformed = transformProfessionalTraining(saved.toObject());
    const facultyIds = transformed.faculty_participants.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      let ay = transformed.academic_year;
      if (!ay && transformed.start_date) {
        const y = new Date(transformed.start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'professional', ...transformed };
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

const transformProfessionalTraining = (training) => ({
  training_id: training.training_id,
  department_id: training.department_id,
  title_of_event: training.title_of_event || training.title,
  type_of_training: training.type_of_training,
  mode: training.mode,
  year_of_training: training.year_of_training,
  academic_year: training.academic_year,
  start_date: training.start_date,
  end_date: training.end_date,
  number_of_participants: training.number_of_participants,
  sponsoring_agencies: training.sponsoring_agencies,
  outcome: training.outcome,
  remarks: training.remarks,
  link: training.link,
  faculty_participants: training.faculty_participants || [],
  student_participants: training.student_participants || [],
  external_participants: training.external_participants || [],
  metadata: training.metadata || {}
});

const get = async () => {
  try {
    const trainings = await Training.find({ type: 'professional' }).sort({ start_date: -1 });
    return trainings.map(t => transformProfessionalTraining(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByTrainingId = async (training_id) => {
  try {
    const training = await Training.findOne({ training_id, type: 'professional' });
    return training ? transformProfessionalTraining(training.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const trainings = await Training.find({ department_id, type: 'professional' }).sort({ start_date: -1 });
    return trainings.map(t => transformProfessionalTraining(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (training_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.title_of_event) {
      updateFields.title_of_event = data.title_of_event;
      updateFields.title = data.title_of_event;
    }
    if (data.type_of_training) updateFields.type_of_training = data.type_of_training;
    if (data.mode) updateFields.mode = data.mode;
    if (data.year_of_training) updateFields.year_of_training = data.year_of_training;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.number_of_participants !== undefined) updateFields.number_of_participants = data.number_of_participants;
    if (data.sponsoring_agencies) updateFields.sponsoring_agencies = data.sponsoring_agencies;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.link) updateFields.link = data.link;
    if (data.external_participants) {
      let extParticipants = data.external_participants;
      if (typeof extParticipants === 'string') {
        try { extParticipants = JSON.parse(extParticipants); } catch (e) { extParticipants = []; }
      }
      updateFields.external_participants = extParticipants;
    }
    if (data.faculty_participants) {
      let fParts = data.faculty_participants;
      if (typeof fParts === 'string') {
        try { fParts = JSON.parse(fParts); } catch (e) { fParts = []; }
      }
      if (Array.isArray(fParts)) {
        updateFields.faculty_participants = fParts.map(f => ({ faculty_id: f.faculty_id || f }));
      }
    }
    if (data.student_participants) {
      let sParts = data.student_participants;
      if (typeof sParts === 'string') {
        try { sParts = JSON.parse(sParts); } catch (e) { sParts = []; }
      }
      if (Array.isArray(sParts)) {
        updateFields.student_participants = sParts.map(s => ({ student_id: s.student_id || s }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'professional' };
    if (mongoose.Types.ObjectId.isValid(training_id)) {
      query.$or = [{ training_id: training_id }, { training_record_id: training_id }, { _id: training_id }];
    } else {
      query.$or = [{ training_id: training_id }, { training_record_id: training_id }];
    }

    const result = await Training.findOneAndUpdate(
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
      const transformed = transformProfessionalTraining(result.toObject());
      const facultyIds = transformed.faculty_participants.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.start_date) {
          const y = new Date(transformed.start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'professional',
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

const deleteTraining = async (id) => {
  try {
    const query = { type: 'professional' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ training_id: id }, { training_record_id: id }, { _id: id }];
    } else {
      query.$or = [{ training_id: id }, { training_record_id: id }];
    }

    const training = await Training.findOne(query);
    if (!training) {
      console.warn(`[DELETE TRAINING] Record not found for ID: ${id}`);
      throw new Error(`Professional Training record not found for ID: ${id}`);
    }

    const transformed = transformProfessionalTraining(training.toObject());
    const facultyIds = transformed.faculty_participants.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.academic_year;
    if (!ay && transformed.start_date) {
      const y = new Date(transformed.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'professional', action: 'deleted', ...transformed };

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

export { set, get, getByTrainingId, getByDepartmentId, update, deleteTraining }