import { DepartmentResource } from "../models/departmentResource.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Department Library Books Data Access Layer
 * Updated to use DepartmentResource collection with type='library'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      department_id,
      title_of_book,
      author,
      publisher,
      year_of_publication,
      isbn_number,
      edition,
      type_of_book,
      no_of_copies,
      no_of_students_using,
      link,
      academic_year,
      remarks
    } = data;

    const book_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newResource = new DepartmentResource({
      resource_id: book_id,
      book_id,
      department_id,
      type: 'library',
      title_of_book,
      author,
      publisher,
      year_of_publication,
      isbn_number,
      edition,
      type_of_book,
      no_of_copies,
      no_of_students_using,
      link,
      academic_year,
      remarks,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newResource.save();
    return transformBook(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformBook = (resource) => ({
  book_id: resource.book_id || resource.resource_id,
  department_id: resource.department_id,
  title_of_book: resource.title_of_book,
  author: resource.author,
  publisher: resource.publisher,
  year_of_publication: resource.year_of_publication,
  isbn_number: resource.isbn_number,
  edition: resource.edition,
  type_of_book: resource.type_of_book,
  no_of_copies: resource.no_of_copies,
  no_of_students_using: resource.no_of_students_using,
  link: resource.link,
  academic_year: resource.academic_year,
  remarks: resource.remarks,
  metadata: resource.metadata || {}
});

const get = async () => {
  try {
    const resources = await DepartmentResource.find({ type: 'library' }).sort({ title_of_book: 1 });
    return resources.map(r => transformBook(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByBookId = async (book_id) => {
  try {
    const resource = await DepartmentResource.findOne({ book_id, type: 'library' });
    return resource ? transformBook(resource.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const resources = await DepartmentResource.find({ department_id, type: 'library' }).sort({ title_of_book: 1 });
    return resources.map(r => transformBook(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (book_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.title_of_book) updateFields.title_of_book = data.title_of_book;
    if (data.author) updateFields.author = data.author;
    if (data.publisher) updateFields.publisher = data.publisher;
    if (data.year_of_publication) updateFields.year_of_publication = data.year_of_publication;
    if (data.isbn_number) updateFields.isbn_number = data.isbn_number;
    if (data.edition) updateFields.edition = data.edition;
    if (data.type_of_book) updateFields.type_of_book = data.type_of_book;
    if (data.no_of_copies !== undefined) updateFields.no_of_copies = data.no_of_copies;
    if (data.no_of_students_using !== undefined) updateFields.no_of_students_using = data.no_of_students_using;
    if (data.link) updateFields.link = data.link;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.remarks) updateFields.remarks = data.remarks;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await DepartmentResource.findOneAndUpdate(
      { book_id, type: 'library' },
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

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteBook = async (book_id) => {
  try {
    await DepartmentResource.findOneAndDelete({ book_id, type: 'library' });
  } catch (error) {
    throw error;
  }
}

export { set, get, getByBookId, getByDepartmentId, update, deleteBook }