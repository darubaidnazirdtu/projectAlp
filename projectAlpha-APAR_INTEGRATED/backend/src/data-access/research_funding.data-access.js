import { ResearchProject } from "../models/researchProject.model.js";
import { v4 as uuidv4 } from 'uuid';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';
import mongoose from 'mongoose';

/**
 * Research Funding Data Access Layer
 * Updated to use ResearchProject collection with type='funding'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      title_research,
      department_id,
      type_of_project,
      funding_agency_name,
      chair_holder,
      funding_type,
      sanction_number,
      year_of_sanction,
      academic_year,
      start_date,
      end_date,
      amount,
      status,
      outcome,
      remarks,
      link,
      faculty_involved = [],
      students_involved = [],
      external_collaborators = []
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

    // console.log('[DEBUG] set ResearchFunding external_collaborators type:', typeof external_collaborators);
    // console.log('[DEBUG] set ResearchFunding external_collaborators value:', external_collaborators);

    if (typeof external_collaborators === 'string') {
      try { external_collaborators = JSON.parse(external_collaborators); } catch (e) {
        external_collaborators = [];
      }
    }
    // console.log('[DEBUG] set ResearchFunding external_collaborators after parse:', Array.isArray(external_collaborators) ? 'Array' : typeof external_collaborators);


    // Check for duplicates
    const existingProject = await ResearchProject.findOne({
      title_research: title_research,
      type: 'funding',
      department_id: department_id,
      funding_agency_name: funding_agency_name
    });

    if (existingProject) {
      throw new Error(`Duplicate Entry: A project with title "${title_research}" and agency "${funding_agency_name}" already exists.`);
    }

    const funding_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    // Add logged-in faculty if role is Faculty Member
    if (loggedInUser?.role === 'Faculty Member' && loggedInUser?.userId) {
      const alreadyIncluded = faculty_involved.some(f => f.faculty_id === loggedInUser.userId);
      if (!alreadyIncluded) {
        faculty_involved.push({ faculty_id: loggedInUser.userId, role: 'Principal Investigator' });
      }
    }

    const newProject = new ResearchProject({
      project_id: funding_id,
      funding_id,
      department_id,
      type: 'funding',
      title_research,
      title: title_research,
      type_of_project,
      funding_agency_name,
      chair_holder,
      agency_name: funding_agency_name,
      funding_type,
      sanction_number,
      year_of_sanction,
      academic_year,
      start_date,
      end_date,
      amount,
      status,
      outcome,
      remarks,
      link,
      faculty_involved: faculty_involved.map(f => ({ faculty_id: f.faculty_id, role: f.role || 'Investigator' })),
      students_involved: students_involved.map(s => ({ student_id: s.student_id, role: s.role || 'Research Assistant' })),
      external_collaborators,
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
    const transformed = transformFunding(saved.toObject());

    // Trigger auto-sync
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      const entryData = { type: 'project', ...transformed };
      triggerAparAutoSyncMultiple(facultyIds, transformed.academic_year, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformed;

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformFunding = (project) => ({
  funding_id: project.funding_id || project.project_id,
  department_id: project.department_id,
  title_research: project.title_research || project.title,
  chair_holder: project.chair_holder,
  type_of_project: project.type_of_project,
  funding_agency_name: project.funding_agency_name || project.agency_name,
  funding_type: project.funding_type,
  sanction_number: project.sanction_number,
  year_of_sanction: project.year_of_sanction,
  academic_year: project.academic_year,
  start_date: project.start_date,
  end_date: project.end_date,
  amount: project.amount,
  status: project.status,
  outcome: project.outcome,
  remarks: project.remarks,
  link: project.link,
  faculty_involved: project.faculty_involved || [],
  students_involved: project.students_involved || [],
  external_collaborators: project.external_collaborators || [],
  metadata: project.metadata || {}
});

const get = async () => {
  try {
    const projects = await ResearchProject.find({ type: 'funding' }).sort({ year_of_sanction: -1 });
    return projects.map(p => transformFunding(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFundingId = async (funding_id) => {
  try {
    const query = { type: 'funding' };
    if (mongoose.Types.ObjectId.isValid(funding_id)) {
      query.$or = [{ funding_id: funding_id }, { project_id: funding_id }, { _id: funding_id }];
    } else {
      query.$or = [{ funding_id: funding_id }, { project_id: funding_id }];
    }
    const project = await ResearchProject.findOne(query);
    return project ? transformFunding(project.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const projects = await ResearchProject.find({ department_id, type: 'funding' }).sort({ year_of_sanction: -1 });
    return projects.map(p => transformFunding(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByStatus = async (status) => {
  try {
    const projects = await ResearchProject.find({ status, type: 'funding' }).sort({ year_of_sanction: -1 });
    return projects.map(p => transformFunding(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFundingType = async (funding_type) => {
  try {
    const projects = await ResearchProject.find({ funding_type, type: 'funding' }).sort({ year_of_sanction: -1 });
    return projects.map(p => transformFunding(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (funding_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.title_research) {
      updateFields.title_research = data.title_research;
      updateFields.title = data.title_research;
    }
    if (data.type_of_project) updateFields.type_of_project = data.type_of_project;
    if (data.funding_agency_name) {
      updateFields.funding_agency_name = data.funding_agency_name;
      updateFields.agency_name = data.funding_agency_name;
    }
    if (data.funding_type) updateFields.funding_type = data.funding_type;
    if (data.chair_holder) updateFields.chair_holder = data.chair_holder;
    if (data.sanction_number) updateFields.sanction_number = data.sanction_number;
    if (data.year_of_sanction) updateFields.year_of_sanction = data.year_of_sanction;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.amount !== undefined) updateFields.amount = data.amount;
    if (data.status) updateFields.status = data.status;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.external_collaborators) {
      let extCollaborators = data.external_collaborators;
      if (typeof extCollaborators === 'string') {
        try { extCollaborators = JSON.parse(extCollaborators); } catch (e) { extCollaborators = []; }
      }
      updateFields.external_collaborators = extCollaborators;
    }
    if (data.faculty_involved) {
      let fInv = data.faculty_involved;
      if (typeof fInv === 'string') {
        try { fInv = JSON.parse(fInv); } catch (e) { fInv = []; }
      }
      if (Array.isArray(fInv)) {
        updateFields.faculty_involved = fInv.map(f => ({ faculty_id: f.faculty_id || f, role: f.role || 'Investigator' }));
      }
    }
    if (data.students_involved) {
      let sInv = data.students_involved;
      if (typeof sInv === 'string') {
        try { sInv = JSON.parse(sInv); } catch (e) { sInv = []; }
      }
      if (Array.isArray(sInv)) {
        updateFields.students_involved = sInv.map(s => ({ student_id: s.student_id || s, role: s.role || 'Research Assistant' }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'funding' };
    if (mongoose.Types.ObjectId.isValid(funding_id)) {
      query.$or = [{ funding_id: funding_id }, { project_id: funding_id }, { _id: funding_id }];
    } else {
      query.$or = [{ funding_id: funding_id }, { project_id: funding_id }];
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
      const transformed = transformFunding(result.toObject());
      const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
      if (facultyIds.length > 0) {
        triggerAparAutoSyncMultiple(facultyIds, transformed.academic_year, {
          type: 'project',
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

const deleteFunding = async (id) => {
  try {
    // Try finding by funding_id (UUID) or _id (MongoID)
    // Try finding by funding_id (UUID) or _id (MongoID)
    const query = { type: 'funding' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ funding_id: id }, { project_id: id }, { _id: id }];
    } else {
      query.$or = [{ funding_id: id }, { project_id: id }];
    }

    const project = await ResearchProject.findOne(query);
    if (!project) {
      console.warn(`[DELETE FUNDING] Project not found for ID: ${id}`);
      // Return early or throw? Controller expects void on success.
      // If we return, controller sends 200. If we throw, it sends 404/500.
      // Throwing is better for debugging.
      throw new Error(`Research Funding record not found for ID: ${id}`);
    }

    const transformed = transformFunding(project.toObject());
    const facultyIds = transformed.faculty_involved.map(f => f.faculty_id).filter(Boolean);
    const entryData = { type: 'project', action: 'deleted', ...transformed };

    await ResearchProject.findOneAndDelete(query);
    console.log(`[DELETE FUNDING] Deleted project: ${project.funding_id}`);

    if (facultyIds.length > 0) {
      // Non-blocking sync trigger
      triggerAparAutoSyncMultiple(facultyIds, transformed.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByFundingId, getByDepartmentId, getByStatus, getByFundingType, update, deleteFunding }
