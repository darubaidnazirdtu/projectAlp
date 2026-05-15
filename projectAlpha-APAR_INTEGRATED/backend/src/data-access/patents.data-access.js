
import { Patent } from "../models/patent.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Patents Data Access Layer
 * Updated to use separate Patent collection
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      patent_title,
      department_id,
      author_names,
      application_number,
      patent_number,
      status,
      country,
      date_of_filing,
      date_of_award,
      patent_awarding_agency,
      link_to_patent,
      academic_year,
      faculty_members = [],
      students = [],
      external_inventors = []
    } = data;

    // Parse JSON strings if necessary
    if (typeof faculty_members === 'string') {
      try { faculty_members = JSON.parse(faculty_members); } catch (e) {
        faculty_members = [];
      }
    }
    if (typeof students === 'string') {
      try { students = JSON.parse(students); } catch (e) {
        students = [];
      }
    }
    if (typeof external_inventors === 'string') {
      try { external_inventors = JSON.parse(external_inventors); } catch (e) {
        external_inventors = [];
      }
    }

    // Normalize arrays
    if (!Array.isArray(faculty_members)) faculty_members = [faculty_members];
    if (!Array.isArray(students)) students = [students];

    // Deduplicate faculty_members and students by their IDs
    const seenFacultyIds = new Set();
    faculty_members = faculty_members.filter(f => {
      const id = f.faculty_id;
      if (!id || seenFacultyIds.has(id)) return false;
      seenFacultyIds.add(id);
      return true;
    });
    const seenStudentIds = new Set();
    students = students.filter(s => {
      const id = s.student_id;
      if (!id || seenStudentIds.has(id)) return false;
      seenStudentIds.add(id);
      return true;
    });

    // Check for duplicates
    const duplicateQuery = {
      department_id,
      $or: [{ patent_title: patent_title }]
    };
    if (patent_number) {
      duplicateQuery.$or.push({ patent_number: patent_number });
    }

    const existingPatent = await Patent.findOne(duplicateQuery);

    if (existingPatent) {
      throw new Error(`Duplicate Entry: A patent with title "${patent_title}" ${patent_number ? 'or number ' + patent_number : ''} already exists.`);
    }

    const patent_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    // Add logged-in faculty if role is Faculty Member
    if (loggedInUser?.role === 'Faculty Member' && loggedInUser?.userId) {
      const alreadyIncluded = faculty_members.some(f => f.faculty_id === loggedInUser.userId);
      if (!alreadyIncluded) {
        faculty_members.push({ faculty_id: loggedInUser.userId });
      }
    }

    const newPatent = new Patent({
      patent_id,
      department_id,
      patent_title,
      author_names,
      application_number,
      patent_number,
      status,
      country,
      date_of_filing,
      date_of_award,
      patent_awarding_agency,
      link_to_patent,
      academic_year,
      faculty_members: faculty_members.map(f => ({ faculty_id: f.faculty_id })),
      students: students.map(s => ({ student_id: s.student_id })),
      external_inventors,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newPatent.save();

    // Trigger auto-sync
    const facultyIds = faculty_members.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      let ay = null;
      const refDate = date_of_filing || date_of_award;
      if (refDate) {
        const y = new Date(refDate).getFullYear();
        if (!isNaN(y)) ay = `${y}-${y + 1}`;
      }

      const entryData = { type: 'patent', ...saved.toObject() };
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
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
    const patents = await Patent.find().sort({ date_of_filing: -1, patent_title: 1 });
    return patents.map(p => p.toObject());
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

const getByPatentId = async (patent_id) => {
  try {
    const patent = await Patent.findOne({ patent_id });
    return patent ? patent.toObject() : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const patents = await Patent.find({ department_id }).sort({ date_of_filing: -1 });
    return patents.map(p => p.toObject());
  } catch (error) {
    throw error;
  }
}

const getByStatus = async (status) => {
  try {
    const patents = await Patent.find({ status }).sort({ date_of_filing: -1 });
    return patents.map(p => p.toObject());
  } catch (error) {
    throw error;
  }
}

const getByCountry = async (country) => {
  try {
    const patents = await Patent.find({ country }).sort({ date_of_filing: -1 });
    return patents.map(p => p.toObject());
  } catch (error) {
    throw error;
  }
}

const update = async (patent_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.patent_title) updateFields.patent_title = data.patent_title;
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.author_names) updateFields.author_names = data.author_names;
    if (data.application_number) updateFields.application_number = data.application_number;
    if (data.patent_number) updateFields.patent_number = data.patent_number;
    if (data.status) updateFields.status = data.status;
    if (data.country) updateFields.country = data.country;
    if (data.date_of_filing) updateFields.date_of_filing = data.date_of_filing;
    if (data.date_of_award) updateFields.date_of_award = data.date_of_award;
    if (data.patent_awarding_agency) updateFields.patent_awarding_agency = data.patent_awarding_agency;
    if (data.link_to_patent) updateFields.link_to_patent = data.link_to_patent;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.external_inventors) {
      let extInventors = data.external_inventors;
      if (typeof extInventors === 'string') {
        try { extInventors = JSON.parse(extInventors); } catch (e) { extInventors = []; }
      }
      updateFields.external_inventors = extInventors;
    }
    if (data.faculty_members) {
      let fMembers = data.faculty_members;
      if (typeof fMembers === 'string') {
        try { fMembers = JSON.parse(fMembers); } catch (e) { fMembers = []; }
      }
      if (Array.isArray(fMembers)) {
        const mapped = fMembers.map(f => ({ faculty_id: f.faculty_id || f }));
        // Deduplicate by faculty_id
        const seen = new Set();
        updateFields.faculty_members = mapped.filter(f => {
          if (!f.faculty_id || seen.has(f.faculty_id)) return false;
          seen.add(f.faculty_id);
          return true;
        });
      }
    }
    if (data.students) {
      let sMembers = data.students;
      if (typeof sMembers === 'string') {
        try { sMembers = JSON.parse(sMembers); } catch (e) { sMembers = []; }
      }
      if (Array.isArray(sMembers)) {
        const mapped = sMembers.map(s => ({ student_id: s.student_id || s }));
        // Deduplicate by student_id
        const seen = new Set();
        updateFields.students = mapped.filter(s => {
          if (!s.student_id || seen.has(s.student_id)) return false;
          seen.add(s.student_id);
          return true;
        });
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Patent.findOneAndUpdate(
      { patent_id },
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
      const facultyIds = result.faculty_members?.map(f => f.faculty_id).filter(Boolean) || [];
      if (facultyIds.length > 0) {
        let ay = null;
        const refDate = result.date_of_filing || result.date_of_award;
        if (refDate) {
          const y = new Date(refDate).getFullYear();
          if (!isNaN(y)) ay = `${y}-${y + 1}`;
        }

        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'patent',
          action: 'updated',
          ...result.toObject()
        }).catch(err =>
          console.error('Auto-sync trigger failed:', err)
        );
      }
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    console.error("Error updating patent:", error);
    throw error;
  }
}

const deletePatent = async (id) => {
  try {
    const query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ patent_id: id }, { _id: id }];
    } else {
      query.patent_id = id;
    }

    const patent = await Patent.findOne(query);
    if (!patent) {
      console.warn(`[DELETE PATENT] Patent not found for ID: ${id}`);
      throw new Error(`Patent record not found for ID: ${id}`);
    }

    const facultyIds = patent.faculty_members?.map(f => f.faculty_id).filter(Boolean) || [];
    let ay = null;
    const refDate = patent.date_of_filing || patent.date_of_award;
    if (refDate) {
      const y = new Date(refDate).getFullYear();
      if (!isNaN(y)) ay = `${y}-${y + 1}`;
    }
    const entryData = { type: 'patent', action: 'deleted', ...patent.toObject() };

    await Patent.findOneAndDelete(query);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    console.error("Error deleting patent:", error);
    throw error;
  }
}

const addFacultyToPatent = async (patent_id, faculty_id) => {
  await Patent.updateOne(
    { patent_id },
    { $addToSet: { faculty_members: { faculty_id } } }
  );
}

const addStudentToPatent = async (patent_id, student_id) => {
  await Patent.updateOne(
    { patent_id },
    { $addToSet: { students: { student_id } } }
  );
}

const removeFacultyFromPatent = async (patent_id, faculty_id) => {
  await Patent.updateOne(
    { patent_id },
    { $pull: { faculty_members: { faculty_id } } }
  );
}

const removeStudentFromPatent = async (patent_id, student_id) => {
  await Patent.updateOne(
    { patent_id },
    { $pull: { students: { student_id } } }
  );
}

export { set, get, getByPatentId, getByDepartmentId, getByStatus, getByCountry, addFacultyToPatent, addStudentToPatent, removeFacultyFromPatent, removeStudentFromPatent, deletePatent, update }
