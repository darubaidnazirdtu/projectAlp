import { StudentActivity } from "../models/studentActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Student Financial Support Events Data Access Layer
 * Updated to use StudentActivity collection with type='financial_support'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      name_of_event,
      type_of_support,
      funding_agency,
      amount_of_support,
      date_of_event,
      academic_year,
      outcome,
      remarks,
      link,
      students = [],
      external_recipients = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof students === 'string') {
      try { students = JSON.parse(students); } catch (e) {
        students = [];
      }
    }
    if (typeof external_recipients === 'string') {
      try { external_recipients = JSON.parse(external_recipients); } catch (e) {
        external_recipients = [];
      }
    }

    const support_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new StudentActivity({
      activity_id: support_id,
      support_id,
      department_id,
      type: 'financial_support',
      name_of_event,
      type_of_support,
      funding_agency,
      amount_of_support,
      date_of_event,
      academic_year,
      outcome,
      remarks,
      link,
      link,
      students_supported: students,
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
    return transformFinancialSupport(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformFinancialSupport = (activity) => ({
  support_id: activity.support_id || activity.activity_id,
  department_id: activity.department_id,
  name_of_event: activity.name_of_event,
  type_of_support: activity.type_of_support,
  funding_agency: activity.funding_agency,
  amount_of_support: activity.amount_of_support,
  date_of_event: activity.date_of_event,
  academic_year: activity.academic_year,
  outcome: activity.outcome,
  remarks: activity.remarks,
  link: activity.link,
  // Return as 'students' to match tableConfig accessor
  students: activity.students_supported || [],
  external_recipients: activity.external_recipients || [],
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await StudentActivity.find({ type: 'financial_support' }).sort({ date_of_event: -1 });
    return activities.map(a => transformFinancialSupport(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getBySupportId = async (support_id) => {
  try {
    const activity = await StudentActivity.findOne({ support_id, type: 'financial_support' });
    return activity ? transformFinancialSupport(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await StudentActivity.find({ department_id, type: 'financial_support' }).sort({ date_of_event: -1 });
    return activities.map(a => transformFinancialSupport(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (support_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_event) updateFields.name_of_event = data.name_of_event;
    if (data.type_of_support) updateFields.type_of_support = data.type_of_support;
    if (data.funding_agency) updateFields.funding_agency = data.funding_agency;
    if (data.amount_of_support !== undefined) updateFields.amount_of_support = data.amount_of_support;
    if (data.date_of_event) updateFields.date_of_event = data.date_of_event;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.link) updateFields.link = data.link;
    if (data.external_recipients) {
      let extRecipients = data.external_recipients;
      if (typeof extRecipients === 'string') {
        try { extRecipients = JSON.parse(extRecipients); } catch (e) { extRecipients = []; }
      }
      updateFields.external_recipients = extRecipients;
    }
    if (data.students) {
      let sMembers = data.students;
      if (typeof sMembers === 'string') {
        try { sMembers = JSON.parse(sMembers); } catch (e) { sMembers = []; }
      }
      // Schema uses 'students_supported', but accessor uses 'students'.
      // The set function maps 'students' to 'students_supported'.
      // We should update 'students_supported' in Mongo.
      if (Array.isArray(sMembers)) {
        updateFields.students_supported = sMembers.map(s => ({ student_id: s.student_id || s }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await StudentActivity.findOneAndUpdate(
      { support_id, type: 'financial_support' },
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

const deleteSupport = async (id) => {
  try {
    const query = { type: 'financial_support' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ support_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ support_id: id }, { activity_id: id }];
    }

    const existing = await StudentActivity.findOne(query);
    if (!existing) {
      throw new Error(`Financial Support record not found for ID: ${id}`);
    }

    await StudentActivity.findOneAndDelete(query);
  } catch (error) {
    throw error;
  }
}

export { set, get, getBySupportId, getByDepartmentId, update, deleteSupport }