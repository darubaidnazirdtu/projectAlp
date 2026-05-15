import { Publication } from "../models/publication.model.js";
import { v4 as uuidv4 } from 'uuid';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';
import mongoose from 'mongoose';

/**
 * Conference Research Papers Data Access Layer
 * Updated to use Publication collection with type='conference'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      title,
      department_id,
      author_names,
      name_of_conference,
      conference_level,
      organizer,
      venue,
      publisher,
      isbn,
      issn,
      volume,
      page_numbers,
      year_of_publication,
      doi,
      indexing,
      award_received,
      link_to_paper,
      paper_status,
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

    // Check for duplicates
    const existingPaper = await Publication.findOne({
      title: title,
      name_of_conference: name_of_conference,
      year_of_publication: year_of_publication,
      department_id: department_id,
      type: 'conference'
    });

    if (existingPaper) {
      throw new Error(`Duplicate Entry: A conference paper "${title}" in "${name_of_conference}" (${year_of_publication}) already exists.`);
    }

    const newPublication = new Publication({
      publication_id: paper_id,
      paper_id,
      department_id,
      type: 'conference',
      title,
      author_names,
      name_of_conference,
      conference_level,
      organizer,
      venue,
      publisher,
      isbn,
      issn,
      volume,
      page_numbers,
      year_of_publication,
      doi,
      indexing,
      award_received,
      paper_status,
      academic_year,
      link: link_to_paper,
      link_to_paper,
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

    // Trigger auto-sync
    const facultyIds = faculty_members.map(f => f.faculty_id).filter(Boolean);
    if (facultyIds.length > 0) {
      const ay = year_of_publication ? `${year_of_publication}-${year_of_publication + 1}` : null;
      const entryData = { type: 'conference', ...saved.toObject() };
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

// Helper to transform to frontend expected format
const transformPaper = (paper) => ({
  paper_id: paper.paper_id || paper.publication_id,
  department_id: paper.department_id,
  title: paper.title,
  author_names: paper.author_names,
  name_of_conference: paper.name_of_conference,
  conference_level: paper.conference_level,
  organizer: paper.organizer,
  venue: paper.venue,
  publisher: paper.publisher,
  isbn: paper.isbn,
  issn: paper.issn,
  volume: paper.volume,
  page_numbers: paper.page_numbers,
  year_of_publication: paper.year_of_publication,
  doi: paper.doi,
  indexing: paper.indexing,
  award_received: paper.award_received,
  paper_status: paper.paper_status,
  academic_year: paper.academic_year,
  link_to_paper: paper.link_to_paper || paper.link,
  faculty_members: (paper.faculty_members || []).map(f => ({
    faculty_id: f.faculty_id
  })),
  students: (paper.students || []).map(s => ({
    student_id: s.student_id
  })),
  external_authors: paper.external_authors || [],
  metadata: paper.metadata || {}
});

const get = async () => {
  try {
    const papers = await Publication.find({ type: 'conference' }).sort({ year_of_publication: -1, title: 1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

const getByPaperId = async (paper_id) => {
  try {
    const paper = await Publication.findOne({ paper_id, type: 'conference' });
    return paper ? transformPaper(paper.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const papers = await Publication.find({ department_id, type: 'conference' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByConference = async (name_of_conference) => {
  try {
    const papers = await Publication.find({ name_of_conference, type: 'conference' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByLevel = async (conference_level) => {
  try {
    const papers = await Publication.find({ conference_level, type: 'conference' }).sort({ year_of_publication: -1 });
    return papers.map(p => transformPaper(p.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (paper_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.title) updateFields.title = data.title;
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_conference) updateFields.name_of_conference = data.name_of_conference;
    if (data.conference_level) updateFields.conference_level = data.conference_level;
    if (data.organizer) updateFields.organizer = data.organizer;
    if (data.venue) updateFields.venue = data.venue;
    if (data.publisher) updateFields.publisher = data.publisher;
    if (data.isbn) updateFields.isbn = data.isbn;
    if (data.issn) updateFields.issn = data.issn;
    if (data.volume) updateFields.volume = data.volume;
    if (data.page_numbers) updateFields.page_numbers = data.page_numbers;
    if (data.year_of_publication) updateFields.year_of_publication = data.year_of_publication;
    if (data.doi) updateFields.doi = data.doi;
    if (data.indexing) updateFields.indexing = data.indexing;
    if (data.award_received) updateFields.award_received = data.award_received;
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

    const result = await Publication.findOneAndUpdate(
      { paper_id, type: 'conference' },
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
        const ay = result.year_of_publication ? `${result.year_of_publication}-${result.year_of_publication + 1}` : null;
        triggerAparAutoSyncMultiple(facultyIds, ay, {
          type: 'conference',
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
    const query = { type: 'conference' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ paper_id: id }, { _id: id }];
    } else {
      query.paper_id = id;
    }

    const paper = await Publication.findOne(query);
    if (!paper) {
      console.warn(`[DELETE CONFERENCE] Paper not found for ID: ${id}`);
      throw new Error(`Conference Paper record not found for ID: ${id}`);
    }

    const facultyIds = paper.faculty_members?.map(f => f.faculty_id).filter(Boolean) || [];
    const ay = paper.year_of_publication ? `${paper.year_of_publication}-${paper.year_of_publication + 1}` : null;

    const entryData = {
      type: 'conference',
      action: 'deleted',
      ...paper.toObject()
    };

    await Publication.findOneAndDelete(query);
    console.log(`[DELETE CONFERENCE] Deleted paper: ${paper.paper_id}`);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

const addFacultyToPaper = async (paper_id, faculty_id) => {
  await Publication.updateOne(
    { paper_id, type: 'conference' },
    { $addToSet: { faculty_members: { faculty_id } } }
  );
}

const addStudentToPaper = async (paper_id, student_id) => {
  await Publication.updateOne(
    { paper_id, type: 'conference' },
    { $addToSet: { students: { student_id } } }
  );
}

const removeFacultyFromPaper = async (paper_id, faculty_id) => {
  await Publication.updateOne(
    { paper_id, type: 'conference' },
    { $pull: { faculty_members: { faculty_id } } }
  );
}

const removeStudentFromPaper = async (paper_id, student_id) => {
  await Publication.updateOne(
    { paper_id, type: 'conference' },
    { $pull: { students: { student_id } } }
  );
}

export { set, get, getByPaperId, getByDepartmentId, getByConference, getByLevel, addFacultyToPaper, addStudentToPaper, removeFacultyFromPaper, removeStudentFromPaper, deletePaper, update }
