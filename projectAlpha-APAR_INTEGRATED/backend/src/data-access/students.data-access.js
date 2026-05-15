import { Student } from "../models/student.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Students Data Access Layer
 * Updated to use separate Student collection instead of nested array in Department
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      student_id,
      enrollment_no,
      name,
      gender,
      date_of_birth,
      email,
      phone,
      department_id,
      programme_id,
      year_of_admission,
      current_semester
    } = data;

    if (!department_id) {
      throw new Error("department_id is required to create a student");
    }

    const newStudentId = student_id || uuidv4();

    const newStudent = new Student({
      student_id: newStudentId,
      department_id,
      programme_id,
      enrollment_no,
      name,
      gender,
      date_of_birth,
      email,
      phone,
      year_of_admission,
      current_semester,
      metadata: {
        created_by: loggedInUser?.userId || loggedInUser?.id || null,
        change_log: [{
          action: 'created',
          user_id: loggedInUser?.userId || loggedInUser?.id || null,
          timestamp: new Date()
        }]
      }
    });

    const savedStudent = await newStudent.save();
    return savedStudent.toObject();

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const get = async () => {
  try {
    const students = await Student.find().sort({ name: 1 });
    return students.map(s => s.toObject());
  } catch (error) {
    throw error;
  }
}

const getByStudentId = async (student_id) => {
  try {
    const student = await Student.findOne({ student_id });
    return student ? student.toObject() : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const students = await Student.find({ department_id }).sort({ name: 1 });
    return students.map(s => s.toObject());
  } catch (error) {
    throw error;
  }
}

const getByProgrammeId = async (programme_id) => {
  try {
    const students = await Student.find({ programme_id }).sort({ name: 1 });
    return students.map(s => s.toObject());
  } catch (error) {
    throw error;
  }
}

const update = async (student_id, updateData, loggedInUser = null) => {
  try {
    const {
      name,
      gender,
      date_of_birth,
      email,
      phone,
      programme_id,
      department_id,
      year_of_admission,
      current_semester,
      enrollment_no
    } = updateData;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (gender) updateFields.gender = gender;
    if (date_of_birth) updateFields.date_of_birth = date_of_birth;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (programme_id) updateFields.programme_id = programme_id;
    if (department_id) updateFields.department_id = department_id;
    if (year_of_admission) updateFields.year_of_admission = year_of_admission;
    if (current_semester) updateFields.current_semester = current_semester;
    if (enrollment_no) updateFields.enrollment_no = enrollment_no;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = {};
    if (mongoose.Types.ObjectId.isValid(student_id)) {
      query.$or = [{ student_id: student_id }, { _id: student_id }];
    } else {
      query.student_id = student_id;
    }

    const result = await Student.findOneAndUpdate(
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

    return result ? { modifiedCount: 1 } : { modifiedCount: 0 };
  } catch (error) {
    throw error;
  }
}

const deleteStudent = async (id) => {
  try {
    const query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ student_id: id }, { _id: id }];
    } else {
      query.student_id = id;
    }

    await Student.findOneAndDelete(query);
  } catch (error) {
    throw error;
  }
}

export { set, get, getByStudentId, getByDepartmentId, getByProgrammeId, update, deleteStudent }