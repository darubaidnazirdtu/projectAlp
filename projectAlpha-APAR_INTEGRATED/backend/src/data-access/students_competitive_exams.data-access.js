import { StudentActivity } from "../models/studentActivity.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Students Competitive Exams Data Access Layer
 * Updated to use StudentActivity collection with type='exam'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      student_id,
      department_id,
      student_name,
      name_of_exam,
      type_of_exam,
      level_of_exam,
      year_of_qualifying,
      academic_year,
      rank_or_score,
      attempt_number,
      programme_applied_for,
      result_status,
      remarks,
      link
    } = data;

    const exam_record_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new StudentActivity({
      activity_id: exam_record_id,
      exam_record_id,
      student_id,
      department_id,
      type: 'exam',
      student_name,
      name_of_exam,
      type_of_exam,
      level_of_exam,
      year_of_qualifying,
      academic_year,
      rank_or_score,
      attempt_number,
      programme_applied_for,
      result_status,
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
    return transformExam(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformExam = (activity) => ({
  exam_record_id: activity.exam_record_id || activity.activity_id,
  student_id: activity.student_id,
  department_id: activity.department_id,
  student_name: activity.student_name,
  name_of_exam: activity.name_of_exam,
  type_of_exam: activity.type_of_exam,
  level_of_exam: activity.level_of_exam,
  year_of_qualifying: activity.year_of_qualifying,
  academic_year: activity.academic_year,
  rank_or_score: activity.rank_or_score,
  attempt_number: activity.attempt_number,
  programme_applied_for: activity.programme_applied_for,
  result_status: activity.result_status,
  remarks: activity.remarks,
  link: activity.link,
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await StudentActivity.find({ type: 'exam' }).sort({ year_of_qualifying: -1 });
    return activities.map(a => transformExam(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByExamRecordId = async (exam_record_id) => {
  try {
    const activity = await StudentActivity.findOne({ exam_record_id, type: 'exam' });
    return activity ? transformExam(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await StudentActivity.find({ department_id, type: 'exam' }).sort({ year_of_qualifying: -1 });
    return activities.map(a => transformExam(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByStudentId = async (student_id) => {
  try {
    const activities = await StudentActivity.find({ student_id, type: 'exam' }).sort({ year_of_qualifying: -1 });
    return activities.map(a => transformExam(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (exam_record_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.student_id) updateFields.student_id = data.student_id;
    if (data.student_name) updateFields.student_name = data.student_name;
    if (data.name_of_exam) updateFields.name_of_exam = data.name_of_exam;
    if (data.type_of_exam) updateFields.type_of_exam = data.type_of_exam;
    if (data.level_of_exam) updateFields.level_of_exam = data.level_of_exam;
    if (data.year_of_qualifying) updateFields.year_of_qualifying = data.year_of_qualifying;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.rank_or_score) updateFields.rank_or_score = data.rank_or_score;
    if (data.attempt_number !== undefined) updateFields.attempt_number = data.attempt_number;
    if (data.programme_applied_for) updateFields.programme_applied_for = data.programme_applied_for;
    if (data.result_status) updateFields.result_status = data.result_status;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await StudentActivity.findOneAndUpdate(
      { exam_record_id, type: 'exam' },
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

const deleteExam = async (exam_record_id) => {
  try {
    await StudentActivity.findOneAndDelete({ exam_record_id, type: 'exam' });
  } catch (error) {
    throw error;
  }
}

export { set, get, getByExamRecordId, getByDepartmentId, getByStudentId, update, deleteExam }