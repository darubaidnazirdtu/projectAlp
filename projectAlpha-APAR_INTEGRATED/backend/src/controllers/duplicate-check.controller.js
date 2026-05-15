import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Publication } from "../models/publication.model.js";
import { ResearchProject } from "../models/researchProject.model.js";
import { Patent } from "../models/patent.model.js";
import { FacultyActivity } from "../models/facultyActivity.model.js";
import { Collaboration } from "../models/collaboration.model.js";
import { PhdDefence } from "../models/phdDefence.model.js";
import { Course } from "../models/course.model.js";
import { Department } from "../models/department.model.js";
import { DepartmentResource } from "../models/departmentResource.model.js";
import { Faculty } from "../models/faculty.model.js";
import { Student } from "../models/student.model.js";
import { StudentActivity } from "../models/studentActivity.model.js";

/**
 * Check for duplicate entries before adding to APAR form
 * Uses 100% threshold matching with trimmed, normalized fields
 * 
 * @route POST /api/apar/check-duplicate
 */
const checkDuplicate = asyncHandler(async (req, res) => {
    const { entity_type, faculty_id, ay, data } = req.body;

    if (!entity_type || !faculty_id || !ay || !data) {
        throw new ApiError(400, "Missing required fields for duplicate check");
    }

    // Normalize helper (trim, lowercase)
    const normalize = (val) => {
        if (typeof val === 'string') return val.trim().toLowerCase();
        if (typeof val === 'number') return String(val);
        return String(val || '').toLowerCase();
    };

    // Matching strategies for each entity type
    const strategies = {
        journal: {
            fields: ['title', 'name_of_journal', 'year_of_publication', 'volume', 'issue'],
            model: Publication,
            query: { type: 'journal', 'faculty_members.faculty_id': faculty_id },
            yearField: 'year_of_publication'
        },
        conference: {
            fields: ['title', 'name_of_conference', 'year_of_publication'],
            model: Publication,
            query: { type: 'conference', 'faculty_members.faculty_id': faculty_id },
            yearField: 'year_of_publication'
        },
        book: {
            fields: ['title_of_book', 'isbn_number', 'year'],
            model: Publication,
            query: { type: 'book', 'faculty_members.faculty_id': faculty_id },
            yearField: 'year'
        },
        patent: {
            fields: ['patent_title', 'application_number'],
            model: Patent,
            query: { 'faculty_members.faculty_id': faculty_id },
            yearField: 'date_of_filing'
        },
        funding: {
            fields: ['title', 'funding_agency_name', 'year_of_sanction'],
            model: ResearchProject,
            query: { type: 'funding', 'faculty_involved.faculty_id': faculty_id },
            yearField: 'year_of_sanction'
        },
        consultancy: {
            fields: ['title', 'agency_name', 'year_of_consultancy'],
            model: ResearchProject,
            query: { type: 'consultancy', 'faculty_involved.faculty_id': faculty_id },
            yearField: 'year_of_consultancy'
        },
        // NEW STRATEGIES
        general_activity: {
            fields: [], // Will be populated dynamically from request input if needed, but here we rely on frontend config sending relevant fields
            model: FacultyActivity,
            query: { faculty_id: faculty_id },
            yearField: 'academic_year' // Most use academic_year or start_date
        },
        collaboration: {
            fields: [],
            model: Collaboration,
            query: { 'faculty_associations.faculty_id': faculty_id },
            yearField: 'academic_year'
        },
        phd: {
            fields: ['student_name', 'thesis_title'],
            model: PhdDefence,
            query: { supervisor_id: faculty_id },
            yearField: 'academic_year'
        },
        course: {
            fields: ['course_name', 'course_code'],
            model: Course,
            query: {}, // Courses are global usually, or dept specific?
            yearField: 'year_of_introduction'
        },
        department: {
            fields: ['department_name'],
            model: Department,
            query: {},
            yearField: null
        },
        dept_resource: {
             fields: [],
             model: DepartmentResource,
             query: { }, // usually filter by dept?
             yearField: 'academic_year'
        },
        faculty: {
            fields: ['name', 'email'],
            model: Faculty,
            query: {},
            yearField: 'joining_date'
        },
        student: {
            fields: ['name', 'roll_number'],
            model: Student,
            query: {},
            yearField: 'enrollment_year'
        },
        student_activity: {
            fields: [],
            model: StudentActivity,
            query: {  }, // Student activities might link to faculty?
            yearField: 'academic_year'
        }
    };

    const strategy = strategies[entity_type];
    if (!strategy) {
        return res.status(200).json(
            new ApiResponse(200, { isDuplicate: false }, "No duplicate check strategy for this entity type")
        );
    }

    // Normalize input fields - only include fields that have values
    const inputFields = {};
    strategy.fields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
            inputFields[field] = normalize(data[field]);
        }
    });

    // Must have at least one field to compare
    if (Object.keys(inputFields).length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { isDuplicate: false }, "No fields to compare")
        );
    }

    // Get year range from academic year
    const ayYears = ay.split('-').map(y => parseInt(y)).filter(n => !isNaN(n));

    // Build query with year filter
    let query = { ...strategy.query };
    if (ayYears.length > 0 && strategy.yearField !== 'date_of_filing') {
        query[strategy.yearField] = { $in: ayYears };
    }

    // Fetch existing entries
    const existingEntries = await strategy.model.find(query).lean();

    // Find 100% matches
    for (const entry of existingEntries) {
        let matchCount = 0;
        let totalFields = Object.keys(inputFields).length;
        const matchedFields = [];

        strategy.fields.forEach(field => {
            if (inputFields[field]) {
                const entryValue = normalize(entry[field]);
                if (inputFields[field] === entryValue) {
                    matchCount++;
                    matchedFields.push(field);
                }
            }
        });

        // 100% threshold: all provided fields must match
        if (matchCount === totalFields && matchCount > 0) {
            return res.status(200).json(
                new ApiResponse(200, {
                    isDuplicate: true,
                    confidence: 1.0,
                    existingEntry: entry,
                    matchedFields: matchedFields
                }, "Duplicate entry found")
            );
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { isDuplicate: false }, "No duplicate found")
    );
});

export default checkDuplicate;
