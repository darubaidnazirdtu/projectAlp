import { Course } from "../models/course.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Courses Data Access Layer
 * Updated to use separate Course collection instead of nested array in Department
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      course_id,
      course_name,
      course_code,
      programme_id,
      department_id,
      credits,
      semester_offered,
      type,
      year_of_introduction,
      focus_on_employability,
      focus_on_entrepreneurship,
      focus_on_skill_development
    } = data;

    const newCourseId = course_id || uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newCourse = new Course({
      course_id: newCourseId,
      department_id,
      programme_id,
      course_name,
      course_code,
      credits,
      semester_offered,
      type,
      year_of_introduction,
      focus_on_employability,
      focus_on_entrepreneurship,
      focus_on_skill_development,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const savedCourse = await newCourse.save();
    return savedCourse.toObject();

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const get = async () => {
  try {
    const courses = await Course.find().sort({ course_name: 1 });
    return courses.map(c => c.toObject());
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
}

const getByCourseId = async (course_id) => {
  try {
    const course = await Course.findOne({ course_id });
    return course ? course.toObject() : null;
  } catch (error) {
    throw error;
  }
}

const getByProgrammeId = async (programme_id) => {
  try {
    const courses = await Course.find({ programme_id }).sort({ course_name: 1 });
    return courses.map(c => c.toObject());
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const courses = await Course.find({ department_id }).sort({ course_name: 1 });
    return courses.map(c => c.toObject());
  } catch (error) {
    throw error;
  }
}

const update = async (course_id, data, loggedInUser = null) => {
  try {
    const {
      course_name,
      course_code,
      programme_id,
      department_id,
      credits,
      semester_offered,
      type,
      year_of_introduction,
      focus_on_employability,
      focus_on_entrepreneurship,
      focus_on_skill_development
    } = data;

    const updateFields = {};
    if (course_name) updateFields.course_name = course_name;
    if (course_code) updateFields.course_code = course_code;
    if (programme_id) updateFields.programme_id = programme_id;
    if (department_id) updateFields.department_id = department_id;
    if (credits !== undefined) updateFields.credits = credits;
    if (semester_offered !== undefined) updateFields.semester_offered = semester_offered;
    if (type) updateFields.type = type;
    if (year_of_introduction !== undefined) updateFields.year_of_introduction = year_of_introduction;
    if (focus_on_employability !== undefined) updateFields.focus_on_employability = focus_on_employability;
    if (focus_on_entrepreneurship !== undefined) updateFields.focus_on_entrepreneurship = focus_on_entrepreneurship;
    if (focus_on_skill_development !== undefined) updateFields.focus_on_skill_development = focus_on_skill_development;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Course.findOneAndUpdate(
      { course_id },
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
    console.error("Error updating data:", error);
    throw error;
  }
}

const deleteCourse = async (course_id) => {
  try {
    await Course.findOneAndDelete({ course_id });
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
}

export { set, get, getByCourseId, getByProgrammeId, getByDepartmentId, update, deleteCourse }