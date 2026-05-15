import { Programme } from "../models/programme.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Programmes with Field Research Data Access Layer
 * Updated to use Programme collection with type='field_research'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      programme_id,
      programme_name,
      programme_code,
      department_id,
      level,
      duration_years,
      intake_capacity,
      has_field_research_component,
      component_name,
      course_code_of_component,
      number_of_students_undertaking,
      academic_year,
      link
    } = data;

    const newProgrammeId = programme_id || uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newProgramme = new Programme({
      programme_id: newProgrammeId,
      department_id,
      type: 'field_research',
      programme_name,
      programme_code,
      level,
      duration_years,
      intake_capacity,
      has_field_research_component: has_field_research_component ?? true,
      component_name,
      course_code_of_component,
      number_of_students_undertaking,
      academic_year,
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

    const savedProgramme = await newProgramme.save();
    return transformFieldResearch(savedProgramme.toObject());

  } catch (error) {
    console.error("Error inserting programme:", error);
    throw error;
  }
}

const transformFieldResearch = (prog) => ({
  programme_id: prog.programme_id,
  department_id: prog.department_id,
  programme_name: prog.programme_name,
  programme_code: prog.programme_code,
  level: prog.level,
  duration_years: prog.duration_years,
  intake_capacity: prog.intake_capacity,
  has_field_research_component: prog.has_field_research_component,
  component_name: prog.component_name,
  course_code_of_component: prog.course_code_of_component,
  number_of_students_undertaking: prog.number_of_students_undertaking,
  academic_year: prog.academic_year,
  link: prog.link,
  metadata: prog.metadata || {}
});

const get = async () => {
  try {
    const programmes = await Programme.find({ type: 'field_research' }).sort({ programme_name: 1 });
    return programmes.map(p => transformFieldResearch(p.toObject()));
  } catch (error) {
    console.error("Error fetching programmes:", error);
    throw error;
  }
}

const getByProgrammeId = async (programme_id) => {
  try {
    const programme = await Programme.findOne({ programme_id, type: 'field_research' });
    return programme ? transformFieldResearch(programme.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const programmes = await Programme.find({ department_id, type: 'field_research' }).sort({ programme_name: 1 });
    return programmes.map(p => transformFieldResearch(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (programme_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.programme_name) updateFields.programme_name = data.programme_name;
    if (data.programme_code) updateFields.programme_code = data.programme_code;
    if (data.level) updateFields.level = data.level;
    if (data.duration_years !== undefined) updateFields.duration_years = data.duration_years;
    if (data.intake_capacity !== undefined) updateFields.intake_capacity = data.intake_capacity;
    if (data.has_field_research_component !== undefined) updateFields.has_field_research_component = data.has_field_research_component;
    if (data.component_name) updateFields.component_name = data.component_name;
    if (data.course_code_of_component) updateFields.course_code_of_component = data.course_code_of_component;
    if (data.number_of_students_undertaking !== undefined) updateFields.number_of_students_undertaking = data.number_of_students_undertaking;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Programme.findOneAndUpdate(
      { programme_id, type: 'field_research' },
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
    console.error("Error updating programme:", error);
    throw error;
  }
}

const deleteProgramme = async (programme_id) => {
  try {
    await Programme.findOneAndDelete({ programme_id, type: 'field_research' });
  } catch (error) {
    console.error("Error deleting programme:", error);
    throw error;
  }
}

export { set, get, getByProgrammeId, getByDepartmentId, update, deleteProgramme }