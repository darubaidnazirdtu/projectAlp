import { PhdDefence } from "../models/phdDefence.model.js";
import { Faculty } from "../models/faculty.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * PhD Defence Data Access Layer
 * Updated to use separate PhdDefence collection
 */

/**
 * Helper function to populate names for co-supervisors and committee members
 * by looking up faculty IDs in the Faculty collection
 */
const populateNames = async (defence) => {
  const result = { ...defence };

  // Populate co-supervisor names
  if (result.co_supervisors && result.co_supervisors.length > 0) {
    const coSupIds = result.co_supervisors.map(cs => cs.co_supervisor_id).filter(Boolean);
    let facultyMap = new Map();
    if (coSupIds.length > 0) {
      const coSupFaculty = await Faculty.find({ faculty_id: { $in: coSupIds } }).select('faculty_id name');
      facultyMap = new Map(coSupFaculty.map(f => [f.faculty_id, f.name]));
    }
    result.co_supervisors = result.co_supervisors.map(cs => ({
      ...cs,
      co_supervisor_name: cs.affiliation_type === 'External' ? cs.external_name : (facultyMap.get(cs.co_supervisor_id) || cs.co_supervisor_id),
      external_affiliation: cs.external_affiliation
    }));
  }

  // Populate committee member names
  if (result.committee_members && result.committee_members.length > 0) {
    const memberIds = result.committee_members.map(m => m.member_id).filter(Boolean);
    if (memberIds.length > 0) {
      const memberFaculty = await Faculty.find({ faculty_id: { $in: memberIds } }).select('faculty_id name');
      const facultyMap = new Map(memberFaculty.map(f => [f.faculty_id, f.name]));
      result.committee_members = result.committee_members.map(m => ({
        ...m,
        member_name: facultyMap.get(m.member_id) || m.member_id
      }));
    }
  }

  return result;
};

const set = async (data, loggedInUser = null) => {
  try {
    let {
      student_id,
      department_id,
      enrollment_no,
      student_name,
      thesis_title,
      thesis_type,
      supervisor_id,
      supervisor_name,
      date_of_admission,
      date_of_src,
      date_of_defence,
      date_of_result_notification,
      result_outcome,
      academic_year,
      remarks,
      link,
      co_supervisors = [],
      committee_members = [],
      external_examiners = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof co_supervisors === 'string') {
      try { co_supervisors = JSON.parse(co_supervisors); } catch (e) {
        co_supervisors = [];
      }
    }
    if (Array.isArray(co_supervisors)) {
      co_supervisors = co_supervisors.map(c => typeof c === 'string' ? { co_supervisor_id: c } : {
        affiliation_type: c.affiliation_type || 'Internal',
        co_supervisor_id: c.co_supervisor_id,
        external_name: c.external_name,
        external_affiliation: c.external_affiliation
      });
    }
    if (typeof committee_members === 'string') {
      try { committee_members = JSON.parse(committee_members); } catch (e) {
        committee_members = [];
      }
    }
    if (typeof external_examiners === 'string') {
      try { external_examiners = JSON.parse(external_examiners); } catch (e) {
        external_examiners = [];
      }
    }

    // Check for duplicates
    const duplicateQuery = { department_id };
    if (enrollment_no) {
      duplicateQuery.enrollment_no = enrollment_no;
    } else {
      duplicateQuery.student_name = student_name;
      duplicateQuery.thesis_title = thesis_title;
    }

    const existingDefence = await PhdDefence.findOne(duplicateQuery);

    if (existingDefence) {
      throw new Error(`Duplicate Entry: PhD Defence for student "${student_name}" (${enrollment_no || thesis_title}) already exists.`);
    }

    const defence_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newDefence = new PhdDefence({
      defence_id,
      student_id,
      department_id,
      enrollment_no,
      student_name,
      thesis_title,
      thesis_type,
      supervisor_id,
      supervisor_name,
      date_of_admission,
      date_of_src,
      date_of_defence,
      date_of_result_notification,
      result_outcome,
      academic_year,
      remarks,
      link,
      co_supervisors,
      committee_members,
      external_examiners,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newDefence.save();

    // Trigger auto-sync
    const facultyIds = [supervisor_id];
    if (co_supervisors && co_supervisors.length > 0) {
      co_supervisors.forEach(cs => {
        if (cs.co_supervisor_id) facultyIds.push(cs.co_supervisor_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    if (uniqueFacultyIds.length > 0) {
      const entryData = { type: 'phd_defence', ...saved.toObject() };
      triggerAparAutoSyncMultiple(uniqueFacultyIds, academic_year, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return saved.toObject();

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const get = async () => {
  try {
    const defences = await PhdDefence.find().sort({ date_of_defence: -1 });
    const defenceObjects = defences.map(d => d.toObject());
    // Populate names for each defence
    const populatedDefences = await Promise.all(defenceObjects.map(populateNames));
    return populatedDefences;
  } catch (error) {
    throw error;
  }
}

const getByDefenceId = async (defence_id) => {
  try {
    const defence = await PhdDefence.findOne({ defence_id });
    if (!defence) return null;
    return await populateNames(defence.toObject());
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const defences = await PhdDefence.find({ department_id }).sort({ date_of_defence: -1 });
    const defenceObjects = defences.map(d => d.toObject());
    return await Promise.all(defenceObjects.map(populateNames));
  } catch (error) {
    throw error;
  }
}

const getBySupervisorId = async (supervisor_id) => {
  try {
    const defences = await PhdDefence.find({ supervisor_id }).sort({ date_of_defence: -1 });
    const defenceObjects = defences.map(d => d.toObject());
    return await Promise.all(defenceObjects.map(populateNames));
  } catch (error) {
    throw error;
  }
}

const getByStudentId = async (student_id) => {
  try {
    const defences = await PhdDefence.find({ student_id }).sort({ date_of_defence: -1 });
    const defenceObjects = defences.map(d => d.toObject());
    return await Promise.all(defenceObjects.map(populateNames));
  } catch (error) {
    throw error;
  }
}

const getByAcademicYear = async (academic_year) => {
  try {
    const defences = await PhdDefence.find({ academic_year }).sort({ date_of_defence: -1 });
    const defenceObjects = defences.map(d => d.toObject());
    return await Promise.all(defenceObjects.map(populateNames));
  } catch (error) {
    throw error;
  }
}

const update = async (defence_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.student_name) updateFields.student_name = data.student_name;
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.student_id) updateFields.student_id = data.student_id;
    if (data.enrollment_no) updateFields.enrollment_no = data.enrollment_no;
    if (data.thesis_title) updateFields.thesis_title = data.thesis_title;
    if (data.thesis_type) updateFields.thesis_type = data.thesis_type;
    if (data.supervisor_id) updateFields.supervisor_id = data.supervisor_id;
    if (data.supervisor_name) updateFields.supervisor_name = data.supervisor_name;
    if (data.date_of_admission) updateFields.date_of_admission = data.date_of_admission;
    if (data.date_of_src) updateFields.date_of_src = data.date_of_src;
    if (data.date_of_defence) updateFields.date_of_defence = data.date_of_defence;
    if (data.date_of_result_notification) updateFields.date_of_result_notification = data.date_of_result_notification;
    if (data.result_outcome) updateFields.result_outcome = data.result_outcome;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;
    if (data.external_examiners) {
      let extExaminers = data.external_examiners;
      if (typeof extExaminers === 'string') {
        try { extExaminers = JSON.parse(extExaminers); } catch (e) { extExaminers = []; }
      }
      updateFields.external_examiners = extExaminers;
    }

    // Also handle co_supervisors and committee_members for JSON parsing if necessary
    if (data.co_supervisors) {
      let coSup = data.co_supervisors;
      if (typeof coSup === 'string') {
        try { coSup = JSON.parse(coSup); } catch (e) { coSup = []; }
      }
      if (Array.isArray(coSup)) {
        updateFields.co_supervisors = coSup.map(c => typeof c === 'string' ? { co_supervisor_id: c } : {
          affiliation_type: c.affiliation_type || 'Internal',
          co_supervisor_id: c.co_supervisor_id,
          external_name: c.external_name,
          external_affiliation: c.external_affiliation
        });
      }
    }

    if (data.committee_members) {
      let commMem = data.committee_members;
      if (typeof commMem === 'string') {
        try { commMem = JSON.parse(commMem); } catch (e) { commMem = []; }
      }
      if (Array.isArray(commMem)) {
        updateFields.committee_members = commMem.map(m => ({ member_id: m.member_id || m }));
      }
    }


    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = {};
    if (mongoose.Types.ObjectId.isValid(defence_id)) {
      query.$or = [{ defence_id: defence_id }, { _id: defence_id }];
    } else {
      query.defence_id = defence_id;
    }

    const result = await PhdDefence.findOneAndUpdate(
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
      const saved = result.toObject();
      const facultyIds = [saved.supervisor_id];
      if (saved.co_supervisors && saved.co_supervisors.length > 0) {
        saved.co_supervisors.forEach(cs => {
          if (cs.co_supervisor_id) facultyIds.push(cs.co_supervisor_id);
        });
      }
      const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

      if (uniqueFacultyIds.length > 0) {
        triggerAparAutoSyncMultiple(uniqueFacultyIds, saved.academic_year, {
          type: 'phd_defence',
          action: 'updated',
          ...saved
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

const deleteDefence = async (id) => {
  try {
    const query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ defence_id: id }, { _id: id }];
    } else {
      query.defence_id = id;
    }

    const defence = await PhdDefence.findOne(query);
    if (!defence) {
      console.warn(`[DELETE PHD] Record not found for ID: ${id}`);
      throw new Error(`PhD Defence record not found for ID: ${id}`);
    }

    const saved = defence.toObject();
    const facultyIds = [saved.supervisor_id];
    if (saved.co_supervisors && saved.co_supervisors.length > 0) {
      saved.co_supervisors.forEach(cs => {
        if (cs.co_supervisor_id) facultyIds.push(cs.co_supervisor_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    const entryData = { type: 'phd_defence', action: 'deleted', ...saved };

    await PhdDefence.findOneAndDelete(query);

    if (uniqueFacultyIds.length > 0) {
      triggerAparAutoSyncMultiple(uniqueFacultyIds, saved.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByDefenceId, getByDepartmentId, getBySupervisorId, getByStudentId, getByAcademicYear, update, deleteDefence }
