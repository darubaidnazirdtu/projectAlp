import { Publication } from "../models/publication.model.js";
import { v4 as uuidv4 } from 'uuid';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';
import mongoose from 'mongoose';

/**
 * Journal Research Papers Data Access Layer
 * Updated to use Publication collection with type='journal'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      title,
      department_id,
      author_names,
      name_of_journal,
      issn,
      volume,
      issue,
      page_numbers,
      year_of_publication,
      doi,
      indexing,
      impact_factor,
      citation_count,
      is_ugc_care_listed,
      link_to_paper,
      academic_year,
      faculty_members = [],
      students = [],
      external_authors = []
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
    if (typeof external_authors === 'string') {
      try { external_authors = JSON.parse(external_authors); } catch (e) {
        external_authors = [];
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

    const paper_id = uuidv4();

    // Add logged-in faculty if role is Faculty Member
    if (loggedInUser?.role === 'Faculty Member' && loggedInUser?.userId) {
      const alreadyIncluded = faculty_members.some(f => f.faculty_id === loggedInUser.userId);
      if (!alreadyIncluded) {
        faculty_members.push({ faculty_id: loggedInUser.userId });
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    // Check for duplicates (Case-insensitive title & journal, same year)
    // We REMOVED department_id from check because a paper is unique regardless of dept.
    const existingPaper = await Publication.findOne({
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      name_of_journal: { $regex: new RegExp(`^${name_of_journal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      year_of_publication: year_of_publication,
      type: 'journal'
    });

    if (existingPaper) {
      console.log(`Duplicate found for "${title}". Merging new details into existing record ${existingPaper.publication_id}`);

      // MERGE LOGIC: Add new faculty, students, external authors to existing record

      // 1. Merge Faculty
      const existingFacultyIds = existingPaper.faculty_members.map(f => f.faculty_id.toString());
      const newFacultyToAdd = faculty_members.filter(f => !existingFacultyIds.includes(f.faculty_id));

      if (newFacultyToAdd.length > 0) {
        existingPaper.faculty_members.push(...newFacultyToAdd.map(f => ({ faculty_id: f.faculty_id })));
      }

      // 2. Merge Students
      const existingStudentIds = existingPaper.students ? existingPaper.students.map(s => s.student_id ? s.student_id.toString() : '') : [];
      const newStudentsToAdd = students.filter(s => s.student_id && !existingStudentIds.includes(s.student_id));

      if (newStudentsToAdd.length > 0) {
        if (!existingPaper.students) existingPaper.students = [];
        existingPaper.students.push(...newStudentsToAdd.map(s => ({ student_id: s.student_id })));
      }

      // 3. Update Metadata (Change Log)
      if (existingPaper.metadata) {
        existingPaper.metadata.change_log.push({
          action: 'merged_duplicate',
          user_id: userId,
          timestamp: new Date(),
          changes: `Merged entry from user ${userId}`
        });
      }

      const updatedPaper = await existingPaper.save();

      // Trigger Auto-Sync for ALL associated faculty (new + old)
      const allFacultyIds = updatedPaper.faculty_members.map(f => f.faculty_id).filter(Boolean);
      if (allFacultyIds.length > 0) {
        const ay = year_of_publication ? `${year_of_publication}-${Number(year_of_publication) + 1}` : null;
        const entryData = { type: 'journal', ...updatedPaper.toObject() };
        triggerAparAutoSyncMultiple(allFacultyIds, ay, entryData).catch(err =>
          console.error('Auto-sync trigger failed (merge):', err)
        );
      }

      return transformPaper(updatedPaper.toObject());
    }

    // --- CREATE NEW RECORD (No Duplicate Found) ---

    const newPublication = new Publication({
      publication_id: paper_id,
      paper_id, // Alias for journals
      department_id,
      type: 'journal',
      title,
      name_of_journal,
      author_names,
      issn,
      volume,
      issue,
      page_numbers,
      year_of_publication,
      doi,
      indexing,
      impact_factor,
      citation_count,
      is_ugc_care_listed,
      link_to_paper,
      academic_year,
      faculty_members: faculty_members.map(f => ({ faculty_id: f.faculty_id })),
      students: students.map(s => ({ student_id: s.student_id })),
      external_authors,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newPublication.save();

    // Trigger auto-sync to APAR forms for associated faculty
    const facultyIds = faculty_members.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      const ay = year_of_publication ? `${year_of_publication}-${Number(year_of_publication) + 1}` : null;
      const entryData = { type: 'journal', ...saved.toObject() };
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformPaper(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

// Helper to get last modifier info
const getLastModifier = (changeLog) => {
  if (!changeLog || changeLog.length === 0) return null;
  const lastEntry = changeLog[changeLog.length - 1];
  return {
    user_id: lastEntry.user_id,
    action: lastEntry.action,
    timestamp: lastEntry.timestamp,
    changes: lastEntry.changes || 'No details'
  };
};

// Helper to transform to frontend expected format
const transformPaper = (paper) => ({
  paper_id: paper.paper_id || paper.publication_id,
  department_id: paper.department_id,
  title: paper.title,
  author_names: paper.author_names,
  name_of_journal: paper.name_of_journal,
  issn: paper.issn,
  volume: paper.volume,
  issue: paper.issue,
  page_numbers: paper.page_numbers,
  year_of_publication: paper.year_of_publication,
  doi: paper.doi,
  indexing: paper.indexing,
  impact_factor: paper.impact_factor,
  citation_count: paper.citation_count,
  is_ugc_care_listed: paper.is_ugc_care_listed,
  link_to_paper: paper.link_to_paper,
  academic_year: paper.academic_year,
  faculty_members: (paper.faculty_members || []).map(f => ({
    faculty_id: f.faculty_id
  })),
  students: (paper.students || []).map(s => ({
    student_id: s.student_id
  })),
  external_authors: paper.external_authors || [],
  metadata: paper.metadata || {},
  // Add change log summary for UI
  last_modified_by: getLastModifier(paper.metadata?.change_log),
  last_modified_at: paper.metadata?.change_log?.length > 0
    ? paper.metadata.change_log[paper.metadata.change_log.length - 1].timestamp
    : paper.metadata?.created_at,
  change_count: paper.metadata?.change_log?.length || 0
});

const get = async () => {
  try {
    const papers = await Publication.find({ type: 'journal' }).sort({ year_of_publication: -1, title: 1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

const getByPaperId = async (paper_id) => {
  try {
    const query = { type: 'journal' };
    if (mongoose.Types.ObjectId.isValid(paper_id)) {
      query.$or = [{ paper_id: paper_id }, { publication_id: paper_id }, { _id: paper_id }];
    } else {
      query.$or = [{ paper_id: paper_id }, { publication_id: paper_id }];
    }
    const paper = await Publication.findOne(query);
    return paper ? transformPaper(paper.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const papers = await Publication.find({ department_id, type: 'journal' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByJournal = async (name_of_journal) => {
  try {
    const papers = await Publication.find({ name_of_journal, type: 'journal' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getUgcCareListed = async () => {
  try {
    const papers = await Publication.find({ is_ugc_care_listed: true, type: 'journal' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (err) { throw err; }
}

const update = async (paper_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.title) updateFields.title = data.title;
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_journal) updateFields.name_of_journal = data.name_of_journal;
    if (data.year_of_publication) updateFields.year_of_publication = data.year_of_publication;
    if (data.issn) updateFields.issn = data.issn;
    if (data.volume) updateFields.volume = data.volume;
    if (data.issue) updateFields.issue = data.issue;
    if (data.page_numbers) updateFields.page_numbers = data.page_numbers;
    if (data.doi) updateFields.doi = data.doi;
    if (data.indexing) updateFields.indexing = data.indexing;
    if (data.impact_factor) updateFields.impact_factor = data.impact_factor;
    if (data.citation_count !== undefined) updateFields.citation_count = data.citation_count;
    if (data.is_ugc_care_listed !== undefined) updateFields.is_ugc_care_listed = data.is_ugc_care_listed;
    if (data.link_to_paper) updateFields.link_to_paper = data.link_to_paper;
    if (data.author_names) updateFields.author_names = data.author_names;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.external_authors) {
      let extAuthors = data.external_authors;
      if (typeof extAuthors === 'string') {
        try { extAuthors = JSON.parse(extAuthors); } catch (e) { extAuthors = []; }
      }
      updateFields.external_authors = extAuthors;
    }
    if (data.faculty_members) {
      let fMembers = data.faculty_members;
      if (typeof fMembers === 'string') {
        try { fMembers = JSON.parse(fMembers); } catch (e) { fMembers = []; }
      }
      if (Array.isArray(fMembers)) {
        const mapped = fMembers.map(f => ({ faculty_id: f.faculty_id || f }));
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

    const query = { type: 'journal' };
    if (mongoose.Types.ObjectId.isValid(paper_id)) {
      query.$or = [{ paper_id: paper_id }, { publication_id: paper_id }, { _id: paper_id }];
    } else {
      query.$or = [{ paper_id: paper_id }, { publication_id: paper_id }];
    }

    const result = await Publication.findOneAndUpdate(
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

    // Trigger auto-sync after update
    if (result) {
      const facultyIds = result.faculty_members?.map(f => f.faculty_id).filter(Boolean) || [];
      if (facultyIds.length > 0) {
        const ay = result.year_of_publication ? `${result.year_of_publication}-${result.year_of_publication + 1}` : null;
        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'journal',
          action: 'updated',
          ...result.toObject()
        }).catch(err =>
          console.error('Auto-sync trigger failed:', err)
        );
      }
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    console.error("Error updating paper:", error);
    throw error;
  }
}

const deletePaper = async (id) => {
  try {
    const query = { type: 'journal' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ paper_id: id }, { publication_id: id }, { _id: id }];
    } else {
      query.$or = [{ paper_id: id }, { publication_id: id }];
    }

    const paper = await Publication.findOne(query);
    if (!paper) {
      console.warn(`[DELETE JOURNAL] Paper not found for ID: ${id}`);
      throw new Error(`Research Paper record not found for ID: ${id}`);
    }

    const facultyIds = paper.faculty_members?.map(f => f.faculty_id).filter(Boolean) || [];
    const ay = paper.year_of_publication ? `${paper.year_of_publication}-${paper.year_of_publication + 1}` : null;

    const entryData = {
      type: 'journal',
      action: 'deleted',
      ...paper.toObject()
    };

    await Publication.findOneAndDelete(query);
    console.log(`[DELETE JOURNAL] Deleted paper: ${paper.paper_id}`);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

const addFacultyToPaper = async (paper_id, faculty_id, faculty_name) => {
  await Publication.updateOne(
    { paper_id, type: 'journal' },
    { $addToSet: { faculty_members: { faculty_id } } }
  );
}

const addStudentToPaper = async (paper_id, student_id, student_name) => {
  await Publication.updateOne(
    { paper_id, type: 'journal' },
    { $addToSet: { students: { student_id } } }
  );
}

const removeFacultyFromPaper = async (paper_id, faculty_id) => {
  await Publication.updateOne(
    { paper_id, type: 'journal' },
    { $pull: { faculty_members: { faculty_id } } }
  );
}

const removeStudentFromPaper = async (paper_id, student_id) => {
  await Publication.updateOne(
    { paper_id, type: 'journal' },
    { $pull: { students: { student_id } } }
  );
}

export { set, get, getByPaperId, getByDepartmentId, getByJournal, getUgcCareListed, addFacultyToPaper, addStudentToPaper, removeFacultyFromPaper, removeStudentFromPaper, deletePaper, update }