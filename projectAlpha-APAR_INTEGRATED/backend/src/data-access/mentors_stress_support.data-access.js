import { Training } from "../models/training.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Mentors Stress Support Data Access Layer
 * Updated to use Training collection with type='mentoring'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      faculty_id,
      department_id,
      activity_type,
      academic_year,
      semester,
      mentor_mentee_ratio,
      number_of_participants,
      target_group,
      mode,
      date_of_activity,
      duration_hours,
      organizer_name,
      mentor_name,
      student_details,
      outcome,
      feedback_summary,
      remarks,
      evidence_link
    } = data;

    const mentor_record_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newTraining = new Training({
      training_id: mentor_record_id,
      mentor_record_id,
      faculty_id,
      department_id,
      type: 'mentoring',
      title: activity_type,
      activity_type,
      type_of_training: activity_type,
      academic_year,
      semester,
      mentor_mentee_ratio,
      number_of_participants,
      target_group,
      mode,
      date_of_activity,
      start_date: date_of_activity,
      duration_hours,
      organizer_name,
      mentor_name,
      student_details,
      outcome,
      feedback_summary,
      remarks,
      evidence_link,
      link: evidence_link,
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
    if (faculty_id) {
      triggerAparAutoSyncMultiple([faculty_id], academic_year, {
        type: 'mentoring',
        ...saved.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformMentoring(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformMentoring = (training) => ({
  mentor_record_id: training.mentor_record_id || training.training_id,
  faculty_id: training.faculty_id,
  department_id: training.department_id,
  activity_type: training.activity_type,
  academic_year: training.academic_year,
  semester: training.semester,
  mentor_mentee_ratio: training.mentor_mentee_ratio,
  number_of_participants: training.number_of_participants,
  target_group: training.target_group,
  mode: training.mode,
  date_of_activity: training.date_of_activity || training.start_date,
  duration_hours: training.duration_hours,
  organizer_name: training.organizer_name,
  mentor_name: training.mentor_name,
  student_details: training.student_details,
  outcome: training.outcome,
  feedback_summary: training.feedback_summary,
  remarks: training.remarks,
  evidence_link: training.evidence_link || training.link,
  metadata: training.metadata || {}
});

const get = async () => {
  try {
    const trainings = await Training.find({ type: 'mentoring' }).sort({ date_of_activity: -1 });
    return trainings.map(t => transformMentoring(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByMentorRecordId = async (mentor_record_id) => {
  try {
    const training = await Training.findOne({ mentor_record_id, type: 'mentoring' });
    return training ? transformMentoring(training.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const trainings = await Training.find({ department_id, type: 'mentoring' }).sort({ date_of_activity: -1 });
    return trainings.map(t => transformMentoring(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const trainings = await Training.find({ faculty_id, type: 'mentoring' }).sort({ date_of_activity: -1 });
    return trainings.map(t => transformMentoring(t.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (mentor_record_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.activity_type) {
      updateFields.activity_type = data.activity_type;
      updateFields.title = data.activity_type;
      updateFields.type_of_training = data.activity_type;
    }
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.semester) updateFields.semester = data.semester;
    if (data.mentor_mentee_ratio) updateFields.mentor_mentee_ratio = data.mentor_mentee_ratio;
    if (data.number_of_participants !== undefined) updateFields.number_of_participants = data.number_of_participants;
    if (data.target_group) updateFields.target_group = data.target_group;
    if (data.mode) updateFields.mode = data.mode;
    if (data.date_of_activity) {
      updateFields.date_of_activity = data.date_of_activity;
      updateFields.start_date = data.date_of_activity;
    }
    if (data.duration_hours !== undefined) updateFields.duration_hours = data.duration_hours;
    if (data.organizer_name) updateFields.organizer_name = data.organizer_name;
    if (data.mentor_name) updateFields.mentor_name = data.mentor_name;
    if (data.student_details) updateFields.student_details = data.student_details;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.feedback_summary) updateFields.feedback_summary = data.feedback_summary;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.evidence_link) {
      updateFields.evidence_link = data.evidence_link;
      updateFields.link = data.evidence_link;
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Training.findOneAndUpdate(
      { mentor_record_id, type: 'mentoring' },
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
        type: 'mentoring',
        action: 'updated',
        ...transformMentoring(result.toObject())
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteMentoring = async (id) => {
  try {
    const query = { type: 'mentoring' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ mentor_record_id: id }, { training_record_id: id }, { _id: id }];
    } else {
      query.$or = [{ mentor_record_id: id }, { training_record_id: id }];
    }

    const training = await Training.findOne(query);
    if (!training) {
      console.warn(`[DELETE MENTORING] Record not found for ID: ${id}`);
      throw new Error(`Mentoring record not found for ID: ${id}`);
    }

    const entryData = { type: 'mentoring', action: 'deleted', ...transformMentoring(training.toObject()) };

    await Training.findOneAndDelete(query);

    if (training.faculty_id) {
      triggerAparAutoSyncMultiple([training.faculty_id], training.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByMentorRecordId, getByDepartmentId, getByFacultyId, update, deleteMentoring }