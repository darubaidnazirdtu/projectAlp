import { Publication } from "../models/publication.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * Books & Chapters Published Data Access Layer
 * Updated to use Publication collection with type='book'
 */

const set = async (data, loggedInUser = null) => {
  try {
    let {
      title_of_book,
      title_of_chapter,
      department_id,
      publication_type,
      role,
      year,
      isbn_number,
      name_of_publisher,
      publisher_type,
      doi,
      indexing,
      same_institute_affiliation,
      link_to_publication,
      academic_year,
      faculty_members = [],
      students = [],
      external_contributors = []
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
    if (typeof external_contributors === 'string') {
      try { external_contributors = JSON.parse(external_contributors); } catch (e) {
        external_contributors = [];
      }
    }

    if (!Array.isArray(faculty_members)) faculty_members = [faculty_members];
    // Map to the new schema format
    faculty_members = faculty_members.map(f => {
      if (typeof f === 'string') return { faculty_id: f };
      return {
        faculty_id: f.faculty_id || f.id || f.emp_code,
        author_type: f.author_type,
        name: f.name,
        emp_code: f.emp_code,
        role: f.role
      };
    }).filter(f => f.faculty_id || f.name || f.emp_code);

    if (!Array.isArray(students)) students = [students];
    students = students.map(s => {
      if (typeof s === 'string') return { student_id: s };
      return {
        student_id: s.student_id || s.roll_no,
        name: s.name,
        roll_no: s.roll_no
      };
    }).filter(s => s.student_id || s.name || s.roll_no);

    // Check for duplicates
    const existingBook = await Publication.findOne({
      title_of_book: title_of_book,
      title_of_chapter: title_of_chapter,
      year_of_publication: year,
      department_id: department_id,
      type: 'book'
    });

    if (existingBook) {
      throw new Error(`Duplicate Entry: A book/chapter "${title_of_book || title_of_chapter}" (${year}) already exists.`);
    }

    const publication_id = uuidv4();

    // Add logged-in faculty if role is Faculty Member
    if (loggedInUser?.role === 'Faculty Member' && loggedInUser?.userId) {
      if (!faculty_members.some(f => String(f.faculty_id) === String(loggedInUser.userId) || String(f.emp_code) === String(loggedInUser.userId))) {
        faculty_members.push({ faculty_id: loggedInUser.userId });
      }
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newPublication = new Publication({
      publication_id,
      department_id,
      type: 'book',
      publication_type,
      title_of_book,
      title_of_chapter,
      title: title_of_book || title_of_chapter, // Common title field
      role,
      year,
      year_of_publication: year, // Alias
      isbn_number,
      name_of_publisher,
      publisher_type,
      doi,
      indexing,
      same_institute_affiliation,
      link_to_publication,
      link_to_publication,
      link: link_to_publication,
      academic_year,
      faculty_members,
      students,
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

    const saved = await newPublication.save();

    // Trigger auto-sync
    if (saved.faculty_members && saved.faculty_members.length > 0) {
      const ay = saved.year_of_publication ? `${saved.year_of_publication}-${saved.year_of_publication + 1}` : null;
      const entryData = { type: 'book', ...saved.toObject() };
      const fIds = saved.faculty_members.map(f => f.faculty_id).filter(Boolean);
      triggerAparAutoSyncMultiple(fIds, ay, entryData).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformBook(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

// Helper to transform to frontend expected format
const transformBook = (book) => ({
  publication_id: book.publication_id,
  department_id: book.department_id,
  publication_type: book.publication_type,
  title_of_book: book.title_of_book,
  title_of_chapter: book.title_of_chapter,
  role: book.role,
  year: book.year || book.year_of_publication,
  isbn_number: book.isbn_number,
  name_of_publisher: book.name_of_publisher,
  publisher_type: book.publisher_type,
  doi: book.doi,
  indexing: book.indexing,
  same_institute_affiliation: book.same_institute_affiliation,
  academic_year: book.academic_year,
  link_to_publication: book.link_to_publication || book.link,
  faculty_members: book.faculty_members || [],
  students: book.students || [],
  external_contributors: book.external_contributors || [],
  metadata: book.metadata || {}
});

const get = async () => {
  try {
    const books = await Publication.find({ type: 'book' }).sort({ year: -1, title_of_book: 1 });
    return books.map(b => transformBook(b.toObject()));
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

const getByPublicationId = async (publication_id) => {
  try {
    const book = await Publication.findOne({ publication_id, type: 'book' });
    return book ? transformBook(book.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const books = await Publication.find({ department_id, type: 'book' }).sort({ year: -1 });
    return books.map(b => transformBook(b.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByPublisher = async (name_of_publisher) => {
  try {
    const books = await Publication.find({ name_of_publisher, type: 'book' }).sort({ year: -1 });
    return books.map(b => transformBook(b.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByRole = async (role) => {
  try {
    const books = await Publication.find({ role, type: 'book' }).sort({ year: -1 });
    return books.map(b => transformBook(b.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (publication_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.title_of_book) updateFields.title_of_book = data.title_of_book;
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.title_of_chapter) updateFields.title_of_chapter = data.title_of_chapter;
    if (data.role) updateFields.role = data.role;
    if (data.year) {
      updateFields.year = data.year;
      updateFields.year_of_publication = data.year;
    }
    if (data.isbn_number) updateFields.isbn_number = data.isbn_number;
    if (data.name_of_publisher) updateFields.name_of_publisher = data.name_of_publisher;
    if (data.publisher_type) updateFields.publisher_type = data.publisher_type;
    if (data.doi) updateFields.doi = data.doi;
    if (data.indexing) updateFields.indexing = data.indexing;
    if (data.same_institute_affiliation !== undefined) updateFields.same_institute_affiliation = data.same_institute_affiliation;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.link_to_publication) updateFields.link_to_publication = data.link_to_publication;

    // Handle faculty_members and students updates (expecting objects or strings)
    if (data.faculty_members) {
      let fMembers = data.faculty_members;
      if (typeof fMembers === 'string') {
        try { fMembers = JSON.parse(fMembers); } catch (e) { fMembers = []; }
      }
      if (Array.isArray(fMembers)) {
        updateFields.faculty_members = fMembers.map(f => {
          if (typeof f === 'string') return { faculty_id: f };
          return {
            faculty_id: f.faculty_id || f.id || f.emp_code,
            author_type: f.author_type,
            name: f.name,
            emp_code: f.emp_code,
            role: f.role
          };
        }).filter(f => f.faculty_id || f.name || f.emp_code);
      }
    }

    if (data.students) {
      let sMembers = data.students;
      if (typeof sMembers === 'string') {
        try { sMembers = JSON.parse(sMembers); } catch (e) { sMembers = []; }
      }
      if (Array.isArray(sMembers)) {
        updateFields.students = sMembers.map(s => {
          if (typeof s === 'string') return { student_id: s };
          return {
            student_id: s.student_id || s.roll_no,
            name: s.name,
            roll_no: s.roll_no
          };
        }).filter(s => s.student_id || s.name || s.roll_no);
      }
    }
    if (data.external_contributors) {
      let extContributors = data.external_contributors;
      if (typeof extContributors === 'string') {
        try { extContributors = JSON.parse(extContributors); } catch (e) { extContributors = []; }
      }
      updateFields.external_contributors = extContributors;
    }

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Publication.findOneAndUpdate(
      { publication_id, type: 'book' },
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
    if (result && result.faculty_members && result.faculty_members.length > 0) {
      const ay = result.year_of_publication ? `${result.year_of_publication}-${result.year_of_publication + 1}` : null;
      const fIds = result.faculty_members.map(f => f.faculty_id).filter(Boolean);
      triggerAparAutoSyncMultiple(fIds, ay, {
        type: 'book',
        action: 'updated',
        ...result.toObject()
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
}

const deleteBook = async (id) => {
  try {
    const query = { type: 'book' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ publication_id: id }, { _id: id }];
    } else {
      query.publication_id = id;
    }

    const book = await Publication.findOne(query);
    if (!book) {
      console.warn(`[DELETE BOOK] Book not found for ID: ${id}`);
      throw new Error(`Book record not found for ID: ${id}`);
    }

    const facultyIds = book.faculty_members ? book.faculty_members.map(f => f.faculty_id).filter(Boolean) : [];
    const ay = book.year_of_publication ? `${book.year_of_publication}-${book.year_of_publication + 1}` : null;
    const entryData = { type: 'book', action: 'deleted', ...book.toObject() };

    await Publication.findOneAndDelete(query);
    console.log(`[DELETE BOOK] Deleted book: ${book.publication_id}`);

    if (facultyIds.length > 0) {
      triggerAparAutoSyncMultiple(facultyIds, ay, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

const addFacultyToBook = async (publication_id, faculty_id) => {
  await Publication.updateOne(
    { publication_id, type: 'book' },
    { $addToSet: { faculty_members: { faculty_id } } }
  );
}

const addStudentToBook = async (publication_id, student_id) => {
  await Publication.updateOne(
    { publication_id, type: 'book' },
    { $addToSet: { students: { student_id } } }
  );
}

const removeFacultyFromBook = async (publication_id, faculty_id) => {
  await Publication.updateOne(
    { publication_id, type: 'book' },
    { $pull: { faculty_members: { faculty_id } } }
  );
}

const removeStudentFromBook = async (publication_id, student_id) => {
  await Publication.updateOne(
    { publication_id, type: 'book' },
    { $pull: { students: { student_id } } }
  );
}

export { set, get, getByPublicationId, getByDepartmentId, getByPublisher, getByRole, addFacultyToBook, addStudentToBook, removeFacultyFromBook, removeStudentFromBook, deleteBook, update }