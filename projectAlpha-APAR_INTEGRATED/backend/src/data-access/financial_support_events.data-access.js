import { FacultyActivity } from "../models/facultyActivity.model.js";
import { v4 as uuidv4 } from 'uuid';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Financial Support Events Data Access Layer
 * Updated to use FacultyActivity collection with type='financial_support'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      department_id,
      faculty_id,
      title_of_event,
      event_type,
      level,
      funding_agency,
      host_institution,
      location,
      purpose,
      amount,
      date_start,
      date_end,
      academic_year,
      outcome,
      link,
      faculty_participants = [],
      external_contributors = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_participants === 'string') {
      try { faculty_participants = JSON.parse(faculty_participants); } catch (e) {
        faculty_participants = [];
      }
    }
    if (typeof external_contributors === 'string') {
      try { external_contributors = JSON.parse(external_contributors); } catch (e) {
        external_contributors = [];
      }
    }

    const support_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newActivity = new FacultyActivity({
      activity_id: support_id,
      support_id,
      faculty_id,
      department_id,
      type: 'financial_support',
      title_of_event,
      title: title_of_event,
      event_type,
      level,
      funding_agency,
      host_institution,
      location,
      purpose,
      amount,
      date_start,
      start_date: date_start,
      date_end,
      end_date: date_end,
      academic_year,
      outcome,
      link,
      faculty_participants,
      external_contributors,
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
    const transformed = transformFinancialSupport(saved.toObject());
    const facultyIds = [transformed.faculty_id];
    if (transformed.faculty_participants && transformed.faculty_participants.length > 0) {
      transformed.faculty_participants.forEach(fp => {
        if (fp.faculty_id) facultyIds.push(fp.faculty_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    if (uniqueFacultyIds.length > 0) {
      let ay = transformed.academic_year;
      if (!ay && transformed.date_start) {
        const y = new Date(transformed.date_start).getFullYear();
        ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'financial_support', ...transformed };
      triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformed;

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformFinancialSupport = (activity) => ({
  support_id: activity.support_id || activity.activity_id,
  faculty_id: activity.faculty_id,
  department_id: activity.department_id,
  title_of_event: activity.title_of_event || activity.title,
  event_type: activity.event_type,
  level: activity.level,
  funding_agency: activity.funding_agency,
  host_institution: activity.host_institution,
  location: activity.location,
  purpose: activity.purpose,
  amount: activity.amount,
  date_start: activity.date_start || activity.start_date,
  date_end: activity.date_end || activity.end_date,
  academic_year: activity.academic_year,
  outcome: activity.outcome,
  link: activity.link,
  faculty_participants: activity.faculty_participants || [],
  external_contributors: activity.external_contributors || [],
  metadata: activity.metadata || {}
});

const get = async () => {
  try {
    const activities = await FacultyActivity.find({ type: 'financial_support' }).sort({ date_start: -1 });
    return activities.map(a => transformFinancialSupport(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getBySupportId = async (support_id) => {
  try {
    const activity = await FacultyActivity.findOne({ support_id, type: 'financial_support' });
    return activity ? transformFinancialSupport(activity.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const activities = await FacultyActivity.find({ department_id, type: 'financial_support' }).sort({ date_start: -1 });
    return activities.map(a => transformFinancialSupport(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByFacultyId = async (faculty_id) => {
  try {
    const activities = await FacultyActivity.find({ faculty_id, type: 'financial_support' }).sort({ date_start: -1 });
    return activities.map(a => transformFinancialSupport(a.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (support_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.title_of_event) {
      updateFields.title_of_event = data.title_of_event;
      updateFields.title = data.title_of_event;
    }
    if (data.event_type) updateFields.event_type = data.event_type;
    if (data.level) updateFields.level = data.level;
    if (data.funding_agency) updateFields.funding_agency = data.funding_agency;
    if (data.host_institution) updateFields.host_institution = data.host_institution;
    if (data.location) updateFields.location = data.location;
    if (data.purpose) updateFields.purpose = data.purpose;
    if (data.amount !== undefined) updateFields.amount = data.amount;
    if (data.date_start) {
      updateFields.date_start = data.date_start;
      updateFields.start_date = data.date_start;
    }
    if (data.date_end) {
      updateFields.date_end = data.date_end;
      updateFields.end_date = data.date_end;
    }
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.link) updateFields.link = data.link;
    if (data.external_contributors) {
      let extContributors = data.external_contributors;
      if (typeof extContributors === 'string') {
        try { extContributors = JSON.parse(extContributors); } catch (e) { extContributors = []; }
      }
      updateFields.external_contributors = extContributors;
    }
    if (data.faculty_participants) {
      let fParticipants = data.faculty_participants;
      if (typeof fParticipants === 'string') {
        try { fParticipants = JSON.parse(fParticipants); } catch (e) { fParticipants = []; }
      }
      if (Array.isArray(fParticipants)) {
        updateFields.faculty_participants = fParticipants.map(f => ({ faculty_id: f.faculty_id || f }));
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await FacultyActivity.findOneAndUpdate(
      { support_id, type: 'financial_support' },
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
      const transformed = transformFinancialSupport(result.toObject());
      const facultyIds = [transformed.faculty_id];
      if (transformed.faculty_participants && transformed.faculty_participants.length > 0) {
        transformed.faculty_participants.forEach(fp => {
          if (fp.faculty_id) facultyIds.push(fp.faculty_id);
        });
      }
      const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

      if (uniqueFacultyIds.length > 0) {
        let ay = transformed.academic_year;
        if (!ay && transformed.date_start) {
          const y = new Date(transformed.date_start).getFullYear();
          ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, {
          type: 'financial_support',
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

const deleteSupport = async (support_id) => {
  try {
    const activity = await FacultyActivity.findOne({ support_id, type: 'financial_support' });
    if (!activity) return;

    const transformed = transformFinancialSupport(activity.toObject());
    const facultyIds = [transformed.faculty_id];
    if (transformed.faculty_participants && transformed.faculty_participants.length > 0) {
      transformed.faculty_participants.forEach(fp => {
        if (fp.faculty_id) facultyIds.push(fp.faculty_id);
      });
    }
    const uniqueFacultyIds = [...new Set(facultyIds.filter(Boolean))];

    let ay = transformed.academic_year;
    if (!ay && transformed.date_start) {
      const y = new Date(transformed.date_start).getFullYear();
      ay = `${y}-${y + 1}`;
    }

    const entryData = { type: 'financial_support', action: 'deleted', ...transformed };

    await FacultyActivity.findOneAndDelete({ support_id, type: 'financial_support' });

    if (uniqueFacultyIds.length > 0) {
      triggerAparAutoSyncMultiple(uniqueFacultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getBySupportId, getByDepartmentId, getByFacultyId, update, deleteSupport }
