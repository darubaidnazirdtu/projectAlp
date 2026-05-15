import { Training } from "../models/training.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Staff Training Data Access Layer
 * Updated to use Training collection with type='staff'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      name_of_official,
      program_name,
      type_of_training,
      mode,
      start_date,
      end_date,
      academic_year,
      organising_agency,
      funding_details,
      outcome,
      remarks,
      link,
      participants = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof participants === 'string') {
      try { participants = JSON.parse(participants); } catch (e) {
        participants = [];
      }
    }

    const training_record_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newTraining = new Training({
      training_id: training_record_id,
      training_record_id,
      department_id,
      type: 'staff',
      title: program_name,
      name_of_official,
      program_name,
      type_of_training,
      mode,
      start_date,
      end_date,
      academic_year,
      organising_agency,
      funding_details,
      outcome,
      remarks,
      link,
      participants,
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
    return transformStaffTraining(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformStaffTraining = (training) => ({
  training_record_id: training.training_record_id || training.training_id,
  department_id: training.department_id,
  name_of_official: training.name_of_official,
  program_name: training.program_name || training.title,
  type_of_training: training.type_of_training,
  mode: training.mode,
  start_date: training.start_date,
  end_date: training.end_date,
  academic_year: training.academic_year,
  organising_agency: training.organising_agency,
  funding_details: training.funding_details,
  outcome: training.outcome,
  remarks: training.remarks,
  link: training.link,
  participants: training.participants || [],
  metadata: training.metadata || {}
});

const get = async () => {
  try {
    const trainings = await Training.find({ type: 'staff' }).sort({ start_date: -1 });
    return trainings.map(t => transformStaffTraining(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByTrainingId = async (training_record_id) => {
  try {
    const training = await Training.findOne({ training_record_id, type: 'staff' });
    return training ? transformStaffTraining(training.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const trainings = await Training.find({ department_id, type: 'staff' }).sort({ start_date: -1 });
    return trainings.map(t => transformStaffTraining(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (training_record_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_official) updateFields.name_of_official = data.name_of_official;
    if (data.program_name) {
      updateFields.program_name = data.program_name;
      updateFields.title = data.program_name;
    }
    if (data.type_of_training) updateFields.type_of_training = data.type_of_training;
    if (data.mode) updateFields.mode = data.mode;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.organising_agency) updateFields.organising_agency = data.organising_agency;
    if (data.funding_details) updateFields.funding_details = data.funding_details;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.participants) {
      let parts = data.participants;
      if (typeof parts === 'string') {
        try { parts = JSON.parse(parts); } catch (e) { parts = []; }
      }
      updateFields.participants = parts;
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'staff' };
    if (mongoose.Types.ObjectId.isValid(training_record_id)) {
      query.$or = [{ training_record_id: training_record_id }, { _id: training_record_id }];
    } else {
      query.training_record_id = training_record_id;
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

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteTraining = async (id) => {
  try {
    const query = { type: 'staff' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ training_record_id: id }, { _id: id }];
    } else {
      query.training_record_id = id;
    }

    const existing = await Training.findOne(query);
    if (!existing) {
      throw new Error(`Staff Training record not found for ID: ${id}`);
    }

    await Training.findOneAndDelete(query);
  } catch (error) {
    throw error;
  }
}

export { set, get, getByTrainingId, getByDepartmentId, update, deleteTraining }