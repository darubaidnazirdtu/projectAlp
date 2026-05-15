import { StudentActivity } from "../models/studentActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Student Performance Activities Data Access Layer
 * Updated to use StudentActivity collection with type='performance'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      academic_year,
      year,
      name_of_award,
      type_of_activity,
      level_of_award,
      category,
      position_or_rank,
      organizing_body,
      outcome,
      remarks,
      link,
      students = [],
      external_participants = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof students === 'string') {
      try { students = JSON.parse(students); } catch (e) {
        students = [];
      }
    }
    if (typeof external_participants === 'string') {
      try { external_participants = JSON.parse(external_participants); } catch (e) {
        external_participants = [];
      }
    }

    const performance_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new StudentActivity({
      activity_id: performance_id,
      performance_id,
      department_id,
      type: 'performance',
      academic_year,
      year,
      name_of_award,
      type_of_activity,
      level_of_award,
      category,
      position_or_rank,
      organizing_body,
      outcome,
      remarks,
      link,
      students,
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

    const saved = await newActivity.save();
    return transformPerformance(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformPerformance = (activity) => ({
  performance_id: activity.performance_id || activity.activity_id,
  department_id: activity.department_id,
  academic_year: activity.academic_year,
  year: activity.year,
  name_of_award: activity.name_of_award,
  type_of_activity: activity.type_of_activity,
  level_of_award: activity.level_of_award,
  category: activity.category,
  position_or_rank: activity.position_or_rank,
  organizing_body: activity.organizing_body,
  outcome: activity.outcome,
  remarks: activity.remarks,
  link: activity.link,
  students: activity.students || [],
  external_participants: activity.external_participants || [],
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await StudentActivity.find({ type: 'performance' }).sort({ year: -1 });
    return activities.map(a => transformPerformance(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByPerformanceId = async (performance_id) => {
  try {
    const activity = await StudentActivity.findOne({ performance_id, type: 'performance' });
    return activity ? transformPerformance(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await StudentActivity.find({ department_id, type: 'performance' }).sort({ year: -1 });
    return activities.map(a => transformPerformance(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (performance_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.year) updateFields.year = data.year;
    if (data.name_of_award) updateFields.name_of_award = data.name_of_award;
    if (data.type_of_activity) updateFields.type_of_activity = data.type_of_activity;
    if (data.level_of_award) updateFields.level_of_award = data.level_of_award;
    if (data.category) updateFields.category = data.category;
    if (data.position_or_rank) updateFields.position_or_rank = data.position_or_rank;
    if (data.organizing_body) updateFields.organizing_body = data.organizing_body;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    // data.link duplicated in target, careful.

    if (data.external_participants) {
      let extParts = data.external_participants;
      if (typeof extParts === 'string') {
        try { extParts = JSON.parse(extParts); } catch (e) { extParts = []; }
      }
      updateFields.external_participants = extParts;
    }
    if (data.students) {
      let sMembers = data.students;
      if (typeof sMembers === 'string') {
        try { sMembers = JSON.parse(sMembers); } catch (e) { sMembers = []; }
      }
      if (Array.isArray(sMembers)) {
        updateFields.students = sMembers.map(s => ({ student_id: s.student_id || s }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'performance' };
    if (mongoose.Types.ObjectId.isValid(performance_id)) {
      query.$or = [{ performance_id: performance_id }, { activity_id: performance_id }, { _id: performance_id }];
    } else {
      query.$or = [{ performance_id: performance_id }, { activity_id: performance_id }];
    }

    const result = await StudentActivity.findOneAndUpdate(
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

const deletePerformance = async (id) => {
  try {
    const query = { type: 'performance' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ performance_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ performance_id: id }, { activity_id: id }];
    }

    const existing = await StudentActivity.findOne(query);
    if (!existing) {
      throw new Error(`Student Performance record not found for ID: ${id}`);
    }

    await StudentActivity.findOneAndDelete(query);
  } catch (error) {
    throw error;
  }
}

export { set, get, getByPerformanceId, getByDepartmentId, update, deletePerformance }