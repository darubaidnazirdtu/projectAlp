import { ResearchProject } from "../models/researchProject.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Revenue from Corporate Training Data Access Layer
 * Updated to use ResearchProject collection with type='corporate_training'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      name_of_program,
      department_id,
      agency_name,
      type_of_agency,
      mode_of_training,
      revenue_generated,
      no_of_participants,
      agency_contact_details,
      number_of_faculties,
      number_of_students,
      number_of_external_trainees,
      duration_start_date,
      end_date,
      year_of_training,
      outcome,
      remarks,
      link,
      academic_year,
      faculty_involved = [],
      students_involved = [],
      external_trainers = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_involved === 'string') {
      try { faculty_involved = JSON.parse(faculty_involved); } catch (e) {
        faculty_involved = [];
      }
    }
    if (typeof students_involved === 'string') {
      try { students_involved = JSON.parse(students_involved); } catch (e) {
        students_involved = [];
      }
    }
    if (typeof external_trainers === 'string') {
      try { external_trainers = JSON.parse(external_trainers); } catch (e) {
        external_trainers = [];
      }
    }

    const training_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newProject = new ResearchProject({
      project_id: training_id,
      training_id,
      department_id,
      type: 'corporate_training',
      name_of_program,
      title: name_of_program,
      agency_name,
      type_of_agency,
      mode_of_training,
      agency_contact_details,
      revenue_generated,
      amount: revenue_generated,
      no_of_participants,
      number_of_faculties,
      number_of_students,
      number_of_external_trainees,
      start_date: duration_start_date,
      end_date,
      year_of_training,
      academic_year,
      outcome,
      remarks,
      link,
      faculty_involved: faculty_involved.map(f => ({ faculty_id: f.faculty_id, role: f.role || 'Trainer' })),
      students_involved: students_involved.map(s => ({ student_id: s.student_id, role: s.role || 'Assistant' })),
      external_trainers,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newProject.save();

    // Trigger auto-sync
    const transformed = transformTraining(saved.toObject());
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      let ay = transformed.year_of_training;
      if (!ay && transformed.duration_start_date) {
        const y = new Date(transformed.duration_start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'corporate_training', ...transformed };
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

const transformTraining = (project) => ({
  training_id: project.training_id || project.project_id,
  department_id: project.department_id,
  name_of_program: project.name_of_program || project.title,
  agency_name: project.agency_name,
  type_of_agency: project.type_of_agency,
  mode_of_training: project.mode_of_training,
  revenue_generated: project.revenue_generated || project.amount,
  no_of_participants: project.no_of_participants,
  agency_contact_details: project.agency_contact_details,
  number_of_faculties: project.number_of_faculties,
  number_of_students: project.number_of_students,
  number_of_external_trainees: project.number_of_external_trainees,
  duration_start_date: project.start_date,
  end_date: project.end_date,
  year_of_training: project.year_of_training,
  academic_year: project.academic_year,
  outcome: project.outcome,
  remarks: project.remarks,
  link: project.link,
  faculty_involved: project.faculty_involved || [],
  students_involved: project.students_involved || [],
  external_trainers: project.external_trainers || [],
  metadata: project.metadata || {}
});

const get = async () => {
  try {
    const projects = await ResearchProject.find({ type: 'corporate_training' }).sort({ year_of_training: -1 });
    return projects.map(p => transformTraining(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByTrainingId = async (training_id) => {
  try {
    const project = await ResearchProject.findOne({ training_id, type: 'corporate_training' });
    return project ? transformTraining(project.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const projects = await ResearchProject.find({ department_id, type: 'corporate_training' }).sort({ year_of_training: -1 });
    return projects.map(p => transformTraining(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (training_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_program) {
      updateFields.name_of_program = data.name_of_program;
      updateFields.title = data.name_of_program;
    }
    if (data.agency_name) updateFields.agency_name = data.agency_name;
    if (data.type_of_agency) updateFields.type_of_agency = data.type_of_agency;
    if (data.mode_of_training) updateFields.mode_of_training = data.mode_of_training;
    if (data.revenue_generated !== undefined) {
      updateFields.revenue_generated = data.revenue_generated;
      updateFields.amount = data.revenue_generated;
    }
    if (data.no_of_participants !== undefined) updateFields.no_of_participants = data.no_of_participants;
    if (data.agency_contact_details) updateFields.agency_contact_details = data.agency_contact_details;
    if (data.number_of_faculties !== undefined) updateFields.number_of_faculties = data.number_of_faculties;
    if (data.number_of_students !== undefined) updateFields.number_of_students = data.number_of_students;
    if (data.number_of_external_trainees !== undefined) updateFields.number_of_external_trainees = data.number_of_external_trainees;
    if (data.duration_start_date) updateFields.start_date = data.duration_start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.year_of_training) updateFields.year_of_training = data.year_of_training;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.external_trainers) {
      let extTrainers = data.external_trainers;
      if (typeof extTrainers === 'string') {
        try { extTrainers = JSON.parse(extTrainers); } catch (e) { extTrainers = []; }
      }
      updateFields.external_trainers = extTrainers;
    }
    if (data.faculty_involved) {
      let fInv = data.faculty_involved;
      if (typeof fInv === 'string') {
        try { fInv = JSON.parse(fInv); } catch (e) { fInv = []; }
      }
      if (Array.isArray(fInv)) {
        updateFields.faculty_involved = fInv.map(f => ({ faculty_id: f.faculty_id || f, role: f.role || 'Trainer' }));
      }
    }
    if (data.students_involved) {
      let sInv = data.students_involved;
      if (typeof sInv === 'string') {
        try { sInv = JSON.parse(sInv); } catch (e) { sInv = []; }
      }
      if (Array.isArray(sInv)) {
        updateFields.students_involved = sInv.map(s => ({ student_id: s.student_id || s, role: s.role || 'Assistant' }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'corporate_training' };
    if (mongoose.Types.ObjectId.isValid(training_id)) {
      query.$or = [{ training_id: training_id }, { project_id: training_id }, { _id: training_id }];
    } else {
      query.$or = [{ training_id: training_id }, { project_id: training_id }];
    }

    const result = await ResearchProject.findOneAndUpdate(
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
      const transformed = transformTraining(result.toObject());
      const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.year_of_training;
        if (!ay && transformed.duration_start_date) {
          const y = new Date(transformed.duration_start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'corporate_training',
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
    const query = { type: 'corporate_training' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ training_id: id }, { project_id: id }, { _id: id }];
    } else {
      query.$or = [{ training_id: id }, { project_id: id }];
    }

    const project = await ResearchProject.findOne(query);
    if (!project) {
      console.warn(`[DELETE TRAINING] Record not found for ID: ${id}`);
      throw new Error(`Corporate Training record not found for ID: ${id}`);
    }

    const transformed = transformTraining(project.toObject());
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.year_of_training;
    if (!ay && transformed.duration_start_date) {
      const y = new Date(transformed.duration_start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'corporate_training', action: 'deleted', ...transformed };

    await ResearchProject.findOneAndDelete(query);

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