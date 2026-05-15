import { ResearchProject } from "../models/researchProject.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Revenue from Consultancy Data Access Layer
 * Updated to use ResearchProject collection with type='consultancy'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      name_of_project,
      department_id,
      agency_name,
      type_of_agency,
      consultancy_type,
      grant_amount,
      revenue_generated,
      duration_start_date,
      end_date,
      year_of_consultancy,
      status,
      outcome,
      remarks,
      link,
      academic_year,
      faculty_involved = [],
      students_involved = [],
      external_consultants = []
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
    if (typeof external_consultants === 'string') {
      try { external_consultants = JSON.parse(external_consultants); } catch (e) {
        external_consultants = [];
      }
    }

    // Check for duplicates
    const existingConsultancy = await ResearchProject.findOne({
      name_of_project: name_of_project,
      agency_name: agency_name,
      department_id: department_id,
      type: 'consultancy'
    });

    if (existingConsultancy) {
      throw new Error(`Duplicate Entry: A consultancy project "${name_of_project}" with agency "${agency_name}" already exists.`);
    }

    const consultancy_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newProject = new ResearchProject({
      project_id: consultancy_id,
      consultancy_id,
      department_id,
      type: 'consultancy',
      name_of_project,
      title: name_of_project,
      agency_name,
      type_of_agency,
      consultancy_type,
      grant_amount,
      revenue_generated,
      amount: revenue_generated || grant_amount,
      duration_start_date,
      start_date: duration_start_date,
      end_date,
      year_of_consultancy,
      academic_year,
      status,
      outcome,
      remarks,
      link,
      faculty_involved: faculty_involved.map(f => ({ faculty_id: f.faculty_id, role: f.role || 'Consultant' })),
      students_involved: students_involved.map(s => ({ student_id: s.student_id, role: s.role || 'Assistant' })),
      external_consultants,
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
    const transformed = transformConsultancy(saved.toObject());
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      const ay = transformed.year_of_consultancy || (transformed.duration_start_date ? new Date(transformed.duration_start_date).getFullYear() + '-' + (new Date(transformed.duration_start_date).getFullYear() + 1) : null);
      const entryData = { type: 'consultancy', ...transformed };
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

const transformConsultancy = (project) => ({
  consultancy_id: project.consultancy_id || project.project_id,
  department_id: project.department_id,
  name_of_project: project.name_of_project || project.title,
  agency_name: project.agency_name,
  type_of_agency: project.type_of_agency,
  consultancy_type: project.consultancy_type,
  grant_amount: project.grant_amount,
  revenue_generated: project.revenue_generated || project.amount,
  duration_start_date: project.duration_start_date || project.start_date,
  end_date: project.end_date,
  year_of_consultancy: project.year_of_consultancy,
  academic_year: project.academic_year,
  status: project.status,
  outcome: project.outcome,
  remarks: project.remarks,
  link: project.link,
  faculty_involved: project.faculty_involved || [],
  students_involved: project.students_involved || [],
  external_consultants: project.external_consultants || [],
  metadata: project.metadata || {}
});

const get = async () => {
  try {
    const projects = await ResearchProject.find({ type: 'consultancy' }).sort({ year_of_consultancy: -1 });
    return projects.map(p => transformConsultancy(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByConsultancyId = async (consultancy_id) => {
  try {
    const query = { type: 'consultancy' };
    if (mongoose.Types.ObjectId.isValid(consultancy_id)) {
      query.$or = [{ consultancy_id: consultancy_id }, { project_id: consultancy_id }, { _id: consultancy_id }];
    } else {
      query.$or = [{ consultancy_id: consultancy_id }, { project_id: consultancy_id }];
    }
    const project = await ResearchProject.findOne(query);
    return project ? transformConsultancy(project.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const projects = await ResearchProject.find({ department_id, type: 'consultancy' }).sort({ year_of_consultancy: -1 });
    return projects.map(p => transformConsultancy(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (consultancy_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_project) {
      updateFields.name_of_project = data.name_of_project;
      updateFields.title = data.name_of_project;
    }
    if (data.agency_name) updateFields.agency_name = data.agency_name;
    if (data.type_of_agency) updateFields.type_of_agency = data.type_of_agency;
    if (data.consultancy_type) updateFields.consultancy_type = data.consultancy_type;
    if (data.grant_amount !== undefined) updateFields.grant_amount = data.grant_amount;
    if (data.revenue_generated !== undefined) {
      updateFields.revenue_generated = data.revenue_generated;
      updateFields.amount = data.revenue_generated;
    }
    if (data.duration_start_date) {
      updateFields.duration_start_date = data.duration_start_date;
      updateFields.start_date = data.duration_start_date;
    }
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.year_of_consultancy) updateFields.year_of_consultancy = data.year_of_consultancy;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.status) updateFields.status = data.status;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.external_consultants) {
      let extConsultants = data.external_consultants;
      if (typeof extConsultants === 'string') {
        try { extConsultants = JSON.parse(extConsultants); } catch (e) { extConsultants = []; }
      }
      updateFields.external_consultants = extConsultants;
    }
    if (data.faculty_involved) {
      let fInv = data.faculty_involved;
      if (typeof fInv === 'string') {
        try { fInv = JSON.parse(fInv); } catch (e) { fInv = []; }
      }
      if (Array.isArray(fInv)) {
        updateFields.faculty_involved = fInv.map(f => ({ faculty_id: f.faculty_id || f, role: f.role || 'Consultant' }));
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

    const query = { type: 'consultancy' };
    if (mongoose.Types.ObjectId.isValid(consultancy_id)) {
      query.$or = [{ consultancy_id: consultancy_id }, { project_id: consultancy_id }, { _id: consultancy_id }];
    } else {
      query.$or = [{ consultancy_id: consultancy_id }, { project_id: consultancy_id }];
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
      const transformed = transformConsultancy(result.toObject());
      const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        let ay = transformed.year_of_consultancy;
        if (!ay && transformed.duration_start_date) {
          const y = new Date(transformed.duration_start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'consultancy',
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

const deleteConsultancy = async (id) => {
  try {
    const query = { type: 'consultancy' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ consultancy_id: id }, { project_id: id }, { _id: id }];
    } else {
      query.$or = [{ consultancy_id: id }, { project_id: id }];
    }

    const project = await ResearchProject.findOne(query);
    if (!project) {
      console.warn(`[DELETE CONSULTANCY] Record not found for ID: ${id}`);
      throw new Error(`Consultancy record not found for ID: ${id}`);
    }

    const transformed = transformConsultancy(project.toObject());
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);

    let ay = transformed.year_of_consultancy;
    if (!ay && transformed.duration_start_date) {
      const y = new Date(transformed.duration_start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'consultancy', action: 'deleted', ...transformed };

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

export { set, get, getByConsultancyId, getByDepartmentId, update, deleteConsultancy }