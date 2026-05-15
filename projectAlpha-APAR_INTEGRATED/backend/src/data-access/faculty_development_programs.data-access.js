import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Faculty Development Programs Data Access Layer
 * Updated to use FacultyActivity collection with type='fdp'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      program_title,
      department_id,
      faculty_id,
      type_of_program,
      level,
      mode,
      start_date,
      end_date,
      duration_days,
      organising_body,
      funding_agency,
      venue,
      academic_year,
      outcome,
      remarks,
      certificate_link,
      faculty_participants = [],
      external_participants = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_participants === 'string') {
      try { faculty_participants = JSON.parse(faculty_participants); } catch (e) {
        faculty_participants = [];
      }
    }
    if (typeof external_participants === 'string') {
      try { external_participants = JSON.parse(external_participants); } catch (e) {
        external_participants = [];
      }
    }

    // Check for duplicates
    const existingProgram = await FacultyActivity.findOne({
      title: program_title,
      faculty_id: faculty_id,
      start_date: start_date,
      type: 'fdp'
    });

    if (existingProgram) {
      throw new Error(`Duplicate Entry: An FDP "${program_title}" starting on ${start_date} already exists.`);
    }

    const program_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    // Add logged-in faculty if applicable
    if (loggedInUser?.role === 'Faculty Member' && loggedInUser?.userId) {
      const alreadyIncluded = faculty_participants.some(f => f.faculty_id === loggedInUser.userId);
      if (!alreadyIncluded) {
        faculty_participants.push({ faculty_id: loggedInUser.userId, role: 'Participant' });
      }
    }

    const newActivity = new FacultyActivity({
      activity_id: program_id,
      program_id,
      faculty_id,
      department_id,
      type: 'fdp',
      program_title,
      title: program_title,
      type_of_program,
      level,
      mode,
      start_date,
      end_date,
      duration_days,
      organising_body,
      funding_agency,
      venue,
      academic_year,
      outcome,
      remarks,
      certificate_link,
      link: certificate_link,
      faculty_participants,
      external_participants,
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

    // Trigger auto-sync
    // FDPs might be single faculty (organizer/attendee) OR have participants.
    const facultyIds = [faculty_id];
    if (faculty_participants && faculty_participants.length > 0) {
      faculty_participants.forEach(fp => {
        if (fp.faculty_id) facultyIds.push(fp.faculty_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    if (uniqueFacultyIds.length > 0) {
      let ay = academic_year;
      if (!ay && start_date) {
        const y = new Date(start_date).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'fdp', ...saved.toObject() };
      triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformFdp(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformFdp = (activity) => ({
  program_id: activity.program_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  program_title: activity.program_title || activity.title,
  type_of_program: activity.type_of_program,
  level: activity.level,
  mode: activity.mode,
  start_date: activity.start_date,
  end_date: activity.end_date,
  duration_days: activity.duration_days,
  organising_body: activity.organising_body,
  funding_agency: activity.funding_agency,
  venue: activity.venue,
  academic_year: activity.academic_year,
  outcome: activity.outcome,
  remarks: activity.remarks,
  certificate_link: activity.certificate_link || activity.link,
  faculty_participants: activity.faculty_participants || [],
  external_participants: activity.external_participants || [],
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'fdp' }).sort({ start_date: -1 });
    return activities.map(a => transformFdp(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByProgramId = async (program_id) => {
  try {
    const activity = await FacultyActivity.findOne({ program_id, type: 'fdp' });
    return activity ? transformFdp(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'fdp' }).sort({ start_date: -1 });
    return activities.map(a => transformFdp(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'fdp' }).sort({ start_date: -1 });
    return activities.map(a => transformFdp(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (program_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.program_title) {
      updateFields.program_title = data.program_title;
      updateFields.title = data.program_title;
    }
    if (data.type_of_program) updateFields.type_of_program = data.type_of_program;
    if (data.level) updateFields.level = data.level;
    if (data.mode) updateFields.mode = data.mode;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.duration_days !== undefined) updateFields.duration_days = data.duration_days;
    if (data.organising_body) updateFields.organising_body = data.organising_body;
    if (data.funding_agency) updateFields.funding_agency = data.funding_agency;
    if (data.venue) updateFields.venue = data.venue;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.certificate_link) {
      updateFields.certificate_link = data.certificate_link;
      updateFields.link = data.certificate_link;
    }
    if (data.external_participants) {
      let extParticipants = data.external_participants;
      if (typeof extParticipants === 'string') {
        try { extParticipants = JSON.parse(extParticipants); } catch (e) { extParticipants = []; }
      }
      updateFields.external_participants = extParticipants;
    }
    if (data.faculty_participants) {
      let fParticipants = data.faculty_participants;
      if (typeof fParticipants === 'string') {
        try { fParticipants = JSON.parse(fParticipants); } catch (e) { fParticipants = []; }
      }
      if (Array.isArray(fParticipants)) {
        // Default role 'Participant' if not provided
        updateFields.faculty_participants = fParticipants.map(f => ({ faculty_id: f.faculty_id || f, role: f.role || 'Participant' }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const query = { type: 'fdp' };
    if (mongoose.Types.ObjectId.isValid(program_id)) {
      query.$or = [{ program_id: program_id }, { activity_id: program_id }, { _id: program_id }];
    } else {
      query.$or = [{ program_id: program_id }, { activity_id: program_id }];
    }

    const result = await FacultyActivity.findOneAndUpdate(
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
      const transformed = transformFdp(result.toObject());
      const facultyIds = [transformed.faculty_id];
      if (transformed.faculty_participants && transformed.faculty_participants.length > 0) {
        transformed.faculty_participants.forEach(fp => {
          if (fp.faculty_id) facultyIds.push(fp.faculty_id);
        });
      }
      const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

      if (uniqueFacultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.start_date) {
          const y = new Date(transformed.start_date).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, {
          type: 'fdp',
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

const deleteProgram = async (id) => {
  try {
    const query = { type: 'fdp' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ program_id: id }, { activity_id: id }, { _id: id }];
    } else {
      query.$or = [{ program_id: id }, { activity_id: id }];
    }

    const activity = await FacultyActivity.findOne(query);
    if (!activity) {
      console.warn(`[DELETE FDP] Record not found for ID: ${id}`);
      throw new Error(`FDP/Workshop record not found for ID: ${id}`);
    }

    const transformed = transformFdp(activity.toObject());
    const facultyIds = [transformed.faculty_id];
    if (transformed.faculty_participants && transformed.faculty_participants.length > 0) {
      transformed.faculty_participants.forEach(fp => {
        if (fp.faculty_id) facultyIds.push(fp.faculty_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    let ay = transformed.academic_year;
    if (!ay && transformed.start_date) {
      const y = new Date(transformed.start_date).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'fdp', action: 'deleted', ...transformed };

    await FacultyActivity.findOneAndDelete(query);

    if (uniqueFacultyIds.length > 0) {
      triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByProgramId, getByDepartmentId, getByFacultyId, update, deleteProgram }
