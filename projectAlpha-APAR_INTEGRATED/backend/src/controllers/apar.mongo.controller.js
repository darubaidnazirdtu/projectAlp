import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { AparForm } from "../models/aparForm.model.js";
import { findUsersByOfficerMapping } from "../data-access/users.data-access.js";
import { findById as findFacultyById, syncAparToFaculty } from "../data-access/faculty.data-access.js";
import { Publication } from "../models/publication.model.js";
import { ResearchProject } from "../models/researchProject.model.js";
import { FacultyActivity } from "../models/facultyActivity.model.js";
import { Patent } from "../models/patent.model.js";
import { PhdDefence } from "../models/phdDefence.model.js";
import { Collaboration } from "../models/collaboration.model.js";
import { Department } from "../models/department.model.js";
import { User } from "../models/user.model.js";
import { Faculty } from "../models/faculty.model.js";
import { createNotification, notifyHeads } from "./notification.controller.js";
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or use generic ID generator

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * Resolve Mongo ID to Readable ID
 */
const resolveToReadableId = async (input_id) => {
    // console.log(`[RESOLVE] Attempting to resolve: ${input_id}`);
    // Check if input_id is a valid Mongo Object ID (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(input_id)) {
        try {
            const user = await User.findById(input_id);
            if (user) {
                // console.log(`[RESOLVE] Found User: ${user.user_id} for Mongo ID: ${input_id}`);
                return user.user_id || input_id; // Default to input if user_id is missing
            } else {
                // console.log(`[RESOLVE] User not found for Mongo ID: ${input_id}`);
            }

            const faculty = await Faculty.findById(input_id);
            if (faculty) {
                // console.log(`[RESOLVE] Found Faculty: ${faculty.faculty_id} for Mongo ID: ${input_id}`);
                return faculty.faculty_id || input_id;
            } else {
                // console.log(`[RESOLVE] Faculty not found for Mongo ID: ${input_id}`);
            }
        } catch (e) {
            console.error("ID resolution error:", e);
        }
    } else {
        // console.log(`[RESOLVE] Input ID ${input_id} is not a valid Mongo ID format.`);
    }
    return input_id;
};

// Helper to safely parse dates (handle empty strings)
const parseDate = (val) => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
};

// Helper to safely parse numbers
const parseNumber = (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
};

// Helper to normalize department_id (resolve name to ID if needed)
const normalizeDepartmentId = async (deptIdInput) => {
    let deptId = deptIdInput;

    // If department_id looks like a name (contains spaces or is very long), try to find the actual ID
    if (deptId && (deptId.includes(' ') || deptId.length > 20)) {
        console.warn(`department_id appears to be a name: "${deptId}". Looking up actual ID...`);
        try {
            const dept = await Department.findOne({ department_name: deptId });
            if (dept) {
                deptId = dept.department_id;
                console.log(`Resolved department "${deptId}" from name "${deptIdInput}"`);
            } else {
                console.warn(`Could not find department with name "${deptId}". Using as-is.`);
            }
        } catch (err) {
            console.error('Department lookup failed:', err);
        }
    }

    // Fallback if still no valid department
    if (!deptId) {
        deptId = "UNKNOWN";
        console.warn(`No department_id provided. Using "UNKNOWN"`);
    }

    return deptId;
};

// Recursive function to remove empty strings from object
const cleanEmptyStrings = (obj) => {
    if (obj !== Object(obj)) return obj; // Primitive
    if (Array.isArray(obj)) {
        return obj.map(item => cleanEmptyStrings(item));
    }
    const newObj = {};
    for (const key in obj) {
        const val = obj[key];
        if (val === '') {
            newObj[key] = undefined;
        } else if (val && typeof val === 'object') {
            newObj[key] = cleanEmptyStrings(val);
        } else {
            newObj[key] = val;
        }
    }
    return newObj;
};

// Helper to compute changes between existing document and update data
const computeChanges = (existingDoc, updateData) => {
    const changes = [];
    const fieldsToIgnore = [
        'metadata', 'faculty_members', 'faculty_involved', 'faculty_associations',
        'faculty_ids', 'student_ids', 'students', 'students_involved',
        'external_authors', 'external_contributors', 'external_collaborators',
        'external_consultants', 'external_trainers', 'external_inventors',
        'faculty_participants', 'external_participants', 'faculty_recipients',
        'student_recipients', 'external_recipients', '_id', '__v', 'createdAt', 'updatedAt'
    ];

    for (const key in updateData) {
        if (fieldsToIgnore.includes(key)) continue;

        const oldVal = existingDoc[key];
        const newVal = updateData[key];

        // Normalise dates 
        const isDate = (d) => d instanceof Date && !isNaN(d.getTime());
        if (isDate(oldVal) || isDate(newVal)) {
            const t1 = isDate(oldVal) ? oldVal.getTime() : null;
            const t2 = isDate(newVal) ? newVal.getTime() : null;
            if (t1 !== t2) {
                const s1 = isDate(oldVal) ? oldVal.toISOString().split('T')[0] : '(empty)';
                const s2 = isDate(newVal) ? newVal.toISOString().split('T')[0] : '(empty)';
                changes.push(`${key}: ${s1} -> ${s2}`);
            }
            continue;
        }

        // Normalise primitives
        const s1 = (oldVal === undefined || oldVal === null) ? '' : String(oldVal);
        const s2 = (newVal === undefined || newVal === null) ? '' : String(newVal);

        if (s1 !== s2) {
            changes.push(`${key}: "${s1}" -> "${s2}"`);
        }
    }
    return changes.length > 0 ? changes.join(', ') : 'Synced from APAR (No field changes detected)';
};

const saveToMonthlyData = asyncHandler(async (req, res) => {
    try {
        let ay = req.body.ay || req.user?.academicYear;
        if (ay) ay = normalizeAY(ay);
        let formData = req.body.formData;
        let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
        faculty_id = await resolveToReadableId(faculty_id);

        console.log(`[SYNC MONTHLY] Syncing for Faculty ID: ${faculty_id} (AY: ${ay})`);

        // Clean formData to replace "" with undefined for Dates/Numbers/Enums
        if (formData) {
            formData = cleanEmptyStrings(formData);
        }

        if (!faculty_id || !formData) {
            throw new ApiError(400, "Missing Faculty ID or Form Data");
        }

        // Validate and normalize department_id
        let deptId = formData.personal?.department_id;

        // If department_id looks like a name (contains spaces or is very long), try to find the actual ID
        if (deptId && (deptId.includes(' ') || deptId.length > 20)) {
            // console.warn(`department_id appears to be a name: "${deptId}". Looking up actual ID...`);
            try {
                const dept = await Department.findOne({ department_name: deptId });
                if (dept) {
                    deptId = dept.department_id;
                    // console.log(`Resolved department "${deptId}" from name "${formData.personal.department_id}"`);
                } else {
                    // console.warn(`Could not find department with name "${deptId}". Using as-is.`);
                }
            } catch (err) {
                console.error('Department lookup failed:', err);
            }
        }

        // Fallback if still no valid department
        if (!deptId) {
            deptId = "UNKNOWN";
            console.warn(`No department_id found in APAR form. Using "UNKNOWN"`);
        }

        // Extract years from academic year (e.g., "2023-2024" -> [2023, 2024])
        const ayYears = ay ? ay.split('-').map(y => parseInt(y)).filter(n => !isNaN(n)) : [];

        // Helper: Check if entry year matches APAR academic year
        const isYearInAY = (year) => {
            if (!year || ayYears.length === 0) return true; // Skip validation if no year info
            const entryYear = typeof year === 'number' ? year : parseInt(year);
            return ayYears.includes(entryYear);
        };

        // 1. Journals
        const journals = formData.research?.journals || [];
        for (const j of journals) {
            const title = j.title || j.title_of_paper || j.name_of_journal;
            if (!title && !j.name_of_journal) continue;

            // Validate year matches academic year
            const entryYear = parseNumber(j.year_of_publication);
            if (entryYear && !isYearInAY(entryYear)) {
                console.warn(`Journal "${title}" has year ${entryYear} which is outside AY ${ay}. Skipping.`);
                continue; // Skip entries that don't match the academic year
            }

            const uniqueTitle = title || j.name_of_journal;
            const pid = j.paper_id;

            let pub = null;
            if (pid) {
                pub = await Publication.findOne({ paper_id: pid, type: 'journal', department_id: deptId });
            }
            // Strict duplicate check: If not found by ID (so treated as new), check by title.
            // If exists by title, THROW ERROR to prevent duplicate creation/ambiguous merge.
            // SMART MERGE: Check if this paper already exists globally (without requiring current user linkage)
            if (!pub && !pid) {
                pub = await Publication.findOne({
                    $or: [
                        { title: uniqueTitle },
                        { name_of_journal: uniqueTitle }
                    ],
                    type: 'journal',
                    year_of_publication: parseNumber(j.year_of_publication),
                    department_id: deptId
                    // REMOVED 'faculty_members.faculty_id': faculty_id check to allow discovering unlinked duplicates
                });

                if (pub) {
                    console.log(`[SMART MERGE] Found existing journal "${uniqueTitle}". Merging user ${faculty_id} into it.`);
                }
            }
            // If pid, and not found, pub is null -> create new (or error? usually create new if ID scheme allows, but here we generate ID)
            // Ideally if pid is sent but not found, it's weird (maybe deleted from IQAC?). We'll treat as new create below.

            const updateData = {
                title: uniqueTitle,
                type: 'journal',
                department_id: deptId,
                year_of_publication: parseNumber(j.year_of_publication),
                name_of_journal: j.name_of_journal,
                author_names: j.author_names,
                issn: j.issn_isbn || j.issn,
                volume: j.volume,
                issue: j.issue,
                page_numbers: j.page_numbers,
                doi: j.doi,
                indexing: j.indexing,
                impact_factor: j.impact_factor,
                citation_count: parseNumber(j.citation_count),
                is_ugc_care_listed: j.is_ugc_care_listed === 'Yes' || j.is_ugc_care_listed === true,
                link: j.link,
                link_to_paper: j.link_to_paper
            };

            let changeDesc = "Synced from APAR";
            if (pub) {
                changeDesc = computeChanges(pub, updateData);
            }

            const logEntry = {
                action: pub ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (pub) {
                if (!pub.metadata) pub.metadata = {};
                if (!pub.metadata.change_log) pub.metadata.change_log = [];

                if (!pub.faculty_members) pub.faculty_members = [];

                // Merge incoming faculty members (preserve roles if present)
                if (j.faculty_members && Array.isArray(j.faculty_members)) {
                    j.faculty_members.forEach(fm => {
                        const existingInfo = pub.faculty_members.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            pub.faculty_members.push(fm);
                        } else if (fm.role) {
                            existingInfo.role = fm.role; // Update role if provided
                        }
                    });
                }

                // Ensure current user is in the list
                if (!pub.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    pub.faculty_members.push({ faculty_id });
                }

                // Sync Students
                if (!pub.students) pub.students = [];
                if (j.students && Array.isArray(j.students)) {
                    j.students.forEach(s => {
                        if (!pub.students.some(existing => existing.student_id === s.student_id)) {
                            pub.students.push(s);
                        }
                    });
                }

                // Sync External Authors
                if (j.external_authors && Array.isArray(j.external_authors)) {
                    pub.external_authors = j.external_authors;
                }

                Object.assign(pub, updateData);
                pub.metadata.change_log.push(logEntry);
                await pub.save();
            } else {

                const newPubId = generateId('PUB');
                // Ensure payload is clean and has ID
                const journalPayload = Object.assign({}, updateData, {
                    publication_id: newPubId,
                    faculty_members: j.faculty_members && j.faculty_members.length > 0 ? j.faculty_members : [{ faculty_id }],
                    students: j.students || [],
                    external_authors: j.external_authors || [],
                    metadata: { change_log: [logEntry] }
                });

                // Fallback: Ensure current user is added if not in payload
                if (!journalPayload.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    journalPayload.faculty_members.push({ faculty_id });
                }

                try {
                    await Publication.create(journalPayload);
                } catch (createErr) {
                    console.error("Publication Create Failed:", createErr.message);
                    console.error("Payload was:", JSON.stringify(journalPayload, null, 2));
                    throw createErr;
                }
            }
        }

        // 2. Conferences
        const conferences = formData.research?.conferences || [];
        for (const c of conferences) {
            const title = c.title_of_paper || c.title;
            if (!title) continue;

            // Validate year matches academic year
            const entryYear = parseNumber(c.year_of_publication);
            if (entryYear && !isYearInAY(entryYear)) {
                console.warn(`Conference "${title}" has year ${entryYear} which is outside AY ${ay}. Skipping.`);
                continue;
            }

            const pid = c.paper_id;

            let pub = null;
            if (pid) {
                pub = await Publication.findOne({ paper_id: pid, type: 'conference', department_id: deptId });
            }
            // SMART MERGE for Conferences
            if (!pub && !pid) {
                pub = await Publication.findOne({
                    $or: [{ title: title }, { name_of_conference: title }, { title_of_paper: title }],
                    type: 'conference',
                    year_of_publication: parseNumber(c.year_of_publication),
                    department_id: deptId
                    // Removed user-specific check
                });

                if (pub) {
                    console.log(`[SMART MERGE] Found existing conference "${title}". Merging user ${faculty_id} into it.`);
                }
            }
            // If still no pub (and no duplicate block), we proceed to create new


            const updateData = {
                title: title,
                type: 'conference',
                department_id: deptId,
                year_of_publication: parseNumber(c.year_of_publication),
                name_of_conference: c.name_of_conference || c.title_of_conference,
                conference_level: c.conference_level,
                organizer: c.organizer,
                isbn: c.isbn || c.issn_isbn,
                venue: c.venue,
                publisher: c.publisher,
                doi: c.doi,
                indexing: c.indexing,
                award_received: c.award_received,
                paper_status: c.paper_status,
                link: c.link,
                link_to_paper: c.link_to_paper
            };

            let changeDesc = "Synced from APAR";
            if (pub) {
                changeDesc = computeChanges(pub, updateData);
            }

            const logEntry = {
                action: pub ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (pub) {
                if (!pub.metadata) pub.metadata = {};
                if (!pub.metadata.change_log) pub.metadata.change_log = [];

                if (!pub.faculty_members) pub.faculty_members = [];

                // Merge faculty
                if (c.faculty_members && Array.isArray(c.faculty_members)) {
                    c.faculty_members.forEach(fm => {
                        const existingInfo = pub.faculty_members.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            pub.faculty_members.push(fm);
                        } else if (fm.role) {
                            existingInfo.role = fm.role;
                        }
                    });
                }

                if (!pub.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    pub.faculty_members.push({ faculty_id });
                }

                // Sync Students
                if (!pub.students) pub.students = [];
                if (c.students && Array.isArray(c.students)) {
                    c.students.forEach(s => {
                        if (!pub.students.some(existing => existing.student_id === s.student_id)) {
                            pub.students.push(s);
                        }
                    });
                }

                // Sync External Contributors
                if (c.external_contributors && Array.isArray(c.external_contributors)) {
                    pub.external_contributors = c.external_contributors;
                }

                Object.assign(pub, updateData);
                pub.metadata.change_log.push(logEntry);
                await pub.save();
            } else {
                const confPayload = Object.assign({}, updateData, {
                    publication_id: generateId('CONF'),
                    faculty_members: c.faculty_members && c.faculty_members.length > 0 ? c.faculty_members : [{ faculty_id }],
                    students: c.students || [],
                    external_contributors: c.external_contributors || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!confPayload.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    confPayload.faculty_members.push({ faculty_id });
                }

                try {
                    await Publication.create(confPayload);
                } catch (err) {
                    console.error("Conference Create Failed:", err.message);
                    throw err;
                }
            }
        }

        // 3. Books
        const books = formData.research?.books || [];
        for (const b of books) {
            const title = b.title_of_book;
            if (!title) continue;

            // Validate year matches academic year
            const entryYear = parseNumber(b.year_of_publication || b.year);
            if (entryYear && !isYearInAY(entryYear)) {
                console.warn(`Book "${title}" has year ${entryYear} which is outside AY ${ay}. Skipping.`);
                continue;
            }

            const pid = b.publication_id;

            let pub = null;
            if (pid) {
                pub = await Publication.findOne({ publication_id: pid, type: 'book', department_id: deptId });
            }
            // SMART MERGE for Books
            if (!pub && !pid) {
                pub = await Publication.findOne({
                    $or: [{ title_of_book: title }, { title_of_chapter: title }],
                    type: 'book',
                    year: parseNumber(b.year_of_publication || b.year),
                    department_id: deptId
                    // Removed user-specific check
                });

                if (pub) {
                    console.log(`[SMART MERGE] Found existing book "${title}". Merging user ${faculty_id} into it.`);
                }
            }


            const updateData = {
                title_of_book: b.title_of_book,
                title_of_chapter: b.title_of_chapter,
                type: 'book',
                department_id: deptId,
                year: parseNumber(b.year_of_publication || b.year),
                isbn_number: b.isbn_number || b.isbn,
                name_of_publisher: b.name_of_publisher || b.publisher,
                doi: b.doi,
                publication_type: b.publication_type,
                role: b.role,
                publisher_type: b.publisher_type,
                same_institute_affiliation: b.same_institute_affiliation === 'Yes' || b.same_institute_affiliation === true,
                link_to_publication: b.link_to_publication,
                link: b.link
            };

            let changeDesc = "Synced from APAR";
            if (pub) {
                changeDesc = computeChanges(pub, updateData);
            }

            const logEntry = {
                action: pub ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (pub) {
                if (!pub.metadata) pub.metadata = {};
                if (!pub.metadata.change_log) pub.metadata.change_log = [];

                if (!pub.faculty_members) pub.faculty_members = [];

                // Merge faculty
                // Frontend sends faculty_ids for books (mapped in AparForm schema as faculty_ids) 
                // But Publication model generally uses faculty_members. Let's support both or normalize to faculty_members.
                // AparForm schema update used 'faculty_ids'. Let's use that from input 'b'.
                if (b.faculty_ids && Array.isArray(b.faculty_ids)) {
                    b.faculty_ids.forEach(fm => {
                        // fm might be { faculty_id } or just ID string if not objectList?
                        // tableConfig says objectList with subFields.
                        const fId = fm.faculty_id || fm;
                        const existingInfo = pub.faculty_members.find(m => m.faculty_id === fId);
                        if (!existingInfo) {
                            pub.faculty_members.push({ faculty_id: fId, role: fm.role });
                        }
                    });
                }

                if (!pub.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    pub.faculty_members.push({ faculty_id });
                }

                if (!pub.students) pub.students = [];
                if (b.student_ids && Array.isArray(b.student_ids)) {
                    b.student_ids.forEach(s => {
                        if (!pub.students.some(existing => existing.student_id === s.student_id)) {
                            pub.students.push(s);
                        }
                    });
                }

                // External
                if (b.external_contributors && Array.isArray(b.external_contributors)) {
                    pub.external_contributors = b.external_contributors;
                }

                Object.assign(pub, updateData);
                pub.metadata.change_log.push(logEntry);
                await pub.save();
            } else {
                const bookPayload = Object.assign({}, updateData, {
                    publication_id: generateId('BOOK'),
                    faculty_members: b.faculty_ids && b.faculty_ids.length > 0 ? b.faculty_ids.map(f => ({ faculty_id: f.faculty_id || f, role: f.role })) : [{ faculty_id }],
                    students: b.student_ids || [],
                    external_contributors: b.external_contributors || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!bookPayload.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    bookPayload.faculty_members.push({ faculty_id });
                }

                try {
                    await Publication.create(bookPayload);
                } catch (err) {
                    console.error("Book Create Failed:", err.message);
                    throw err;
                }
            }
        }

        // 4. Research Projects
        const projects = formData.research?.projects || [];
        for (const p of projects) {
            const title = p.title_research || p.title;
            if (!title) continue;
            const pid = p.project_id;

            let proj = null;
            if (pid) {
                proj = await ResearchProject.findOne({ project_id: pid, type: 'funding', department_id: deptId });
            }
            // SMART MERGE for Projects
            if (!proj && !pid) {
                proj = await ResearchProject.findOne({
                    title: title,
                    type: 'funding',
                    department_id: deptId,
                    funding_agency_name: p.funding_agency_name || p.agency_name || p.funding_agency
                    // Removed user-specific check to allow merging
                });

                if (proj) {
                    console.log(`[SMART MERGE] Found existing project "${title}". Merging user ${faculty_id} into it.`);
                }
            }
            // If still no proj (and no duplicate block), we proceed to create new


            const updateData = {
                title: title,
                title_research: title,
                type: 'funding',
                department_id: deptId,
                amount: parseNumber(p.amount),
                funding_agency_name: p.funding_agency_name || p.agency_name || p.funding_agency,
                start_date: parseDate(p.start_date),
                end_date: parseDate(p.end_date),
                status: p.status || (p.end_date ? 'Completed' : 'Ongoing'),
                outcome: p.outcome,
                remarks: p.remarks,
                link: p.link,
                academic_year: p.academic_year || ay,
                type_of_project: p.type_of_project,
                funding_type: p.funding_type,
                sanction_number: p.sanction_number,
                year_of_sanction: parseNumber(p.year_of_sanction)
            };

            let changeDesc = "Synced from APAR";
            if (proj) {
                changeDesc = computeChanges(proj, updateData);
            }

            const logEntry = {
                action: proj ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (proj) {
                if (!proj.metadata) proj.metadata = {};
                if (!proj.metadata.change_log) proj.metadata.change_log = [];

                if (!proj.faculty_involved) proj.faculty_involved = [];

                if (p.faculty_involved && Array.isArray(p.faculty_involved)) {
                    p.faculty_involved.forEach(fm => {
                        const existingInfo = proj.faculty_involved.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            proj.faculty_involved.push(fm);
                        } else if (fm.role) {
                            existingInfo.role = fm.role;
                        }
                    });
                }

                if (!proj.faculty_involved.some(m => m.faculty_id === faculty_id)) {
                    proj.faculty_involved.push({ faculty_id, role: 'Principal Investigator' });
                }

                // Students Involved
                if (p.students_involved && Array.isArray(p.students_involved)) {
                    proj.students_involved = p.students_involved;
                }

                // External Collaborators
                if (p.external_collaborators && Array.isArray(p.external_collaborators)) {
                    proj.external_collaborators = p.external_collaborators;
                }

                Object.assign(proj, updateData);
                proj.metadata.change_log.push(logEntry);
                await proj.save();
            } else {
                const projPayload = Object.assign({}, updateData, {
                    project_id: generateId('PROJ'),
                    faculty_involved: p.faculty_involved && p.faculty_involved.length > 0 ? p.faculty_involved : [{ faculty_id, role: 'Principal Investigator' }],
                    students_involved: p.students_involved || [],
                    external_collaborators: p.external_collaborators || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!projPayload.faculty_involved.some(m => m.faculty_id === faculty_id)) {
                    projPayload.faculty_involved.push({ faculty_id, role: 'Principal Investigator' });
                }

                try {
                    await ResearchProject.create(projPayload);
                } catch (err) {
                    console.error("Research Project Create Failed:", err.message);
                    throw err;
                }
            }
        }

        // 5. Consultancy
        const consultancy = formData.research?.consultancy || [];
        for (const c of consultancy) {
            const title = c.title || c.name_of_project;
            if (!title) continue;
            const cid = c.consultancy_id;

            let proj = null;
            if (cid) {
                proj = await ResearchProject.findOne({ project_id: cid, type: 'consultancy', department_id: deptId });
            }
            if (!proj) {
                // SMART MERGE for Consultancy
                proj = await ResearchProject.findOne({
                    title: title,
                    type: 'consultancy',
                    department_id: deptId,
                    agency_name: c.agency_name // Added Agency Name check for safety
                    // Removed faculty_involved check
                });
                if (proj) {
                    console.log(`[SMART MERGE] Found existing consultancy "${title}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                title: title,
                name_of_project: title,
                type: 'consultancy',
                department_id: deptId,
                agency_name: c.agency_name,
                grant_amount: parseNumber(c.grant_amount || c.amount),
                revenue_generated: parseNumber(c.revenue || c.amount || c.revenue_generated),
                start_date: parseDate(c.start_date),
                duration_start_date: parseDate(c.start_date),
                end_date: parseDate(c.end_date),
                type_of_agency: c.type_of_agency,
                consultancy_type: c.consultancy_type,
                year_of_consultancy: parseNumber(c.year_of_consultancy),
                remarks: c.remarks,
                link: c.link
            };

            let changeDesc = "Synced from APAR";
            if (proj) {
                changeDesc = computeChanges(proj, updateData);
            }

            const logEntry = {
                action: proj ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (proj) {
                if (!proj.metadata) proj.metadata = {};
                if (!proj.metadata.change_log) proj.metadata.change_log = [];

                if (!proj.faculty_involved) proj.faculty_involved = [];

                if (c.faculty_involved && Array.isArray(c.faculty_involved)) {
                    c.faculty_involved.forEach(fm => {
                        const existingInfo = proj.faculty_involved.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            proj.faculty_involved.push(fm);
                        }
                    });
                }

                if (!proj.faculty_involved.some(m => m.faculty_id === faculty_id)) {
                    proj.faculty_involved.push({ faculty_id, role: 'Principal Consultant' });
                }
                // Students Involved (Generic logic for projects)
                if (c.students_involved && Array.isArray(c.students_involved)) {
                    proj.students_involved = c.students_involved;
                }
                // External Collaborators (Generic logic for projects)
                if (c.external_collaborators && Array.isArray(c.external_collaborators)) {
                    proj.external_collaborators = c.external_collaborators;
                }

                Object.assign(proj, updateData);
                proj.metadata.change_log.push(logEntry);
                await proj.save();
            } else {
                const consPayload = Object.assign({}, updateData, {
                    project_id: generateId('CONS'),
                    faculty_involved: c.faculty_involved && c.faculty_involved.length > 0 ? c.faculty_involved : [{ faculty_id, role: 'Principal Consultant' }],
                    students_involved: c.students_involved || [],
                    external_collaborators: c.external_collaborators || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!consPayload.faculty_involved.some(m => m.faculty_id === faculty_id)) {
                    consPayload.faculty_involved.push({ faculty_id, role: 'Principal Consultant' });
                }

                await ResearchProject.create(consPayload);
            }
        }

        // 6. Patents
        const patents = formData.research?.patents || [];
        for (const p of patents) {
            const num = p.patent_number || p.application_number;
            if (!num) continue;

            // Validate year matches academic year (using filing date year)
            if (p.date_of_filing) {
                const filingYear = new Date(p.date_of_filing).getFullYear();
                if (filingYear && !isYearInAY(filingYear)) {
                    console.warn(`Patent with number ${num} filed in ${filingYear} which is outside AY ${ay}. Skipping.`);
                    continue;
                }
            }

            const pid = p.patent_id;

            let pat = null;
            if (pid) {
                pat = await Patent.findOne({ patent_id: pid, department_id: deptId });
            }
            if (!pat) {
                // SMART MERGE for Patents
                pat = await Patent.findOne({
                    $or: [{ patent_number: num }, { application_number: num }],
                    department_id: deptId
                    // Removed faculty_members check
                });
                if (pat) {
                    console.log(`[SMART MERGE] Found existing patent "${num}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                patent_title: p.patent_title || p.title,
                patent_number: p.patent_number,
                author_names: p.author_names,
                application_number: p.application_number || num,
                status: p.status || 'Filed',
                department_id: deptId,
                date_of_filing: parseDate(p.date_of_filing) || new Date(),
                date_of_award: parseDate(p.date_of_award),
                link_to_patent: p.link_to_patent,
                country: p.country,
                patent_awarding_agency: p.patent_awarding_agency,
                link: p.link
            };

            let changeDesc = "Synced from APAR";
            if (pat) {
                changeDesc = computeChanges(pat, updateData);
            }

            const logEntry = {
                action: pat ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (pat) {
                if (!pat.metadata) pat.metadata = {};
                if (!pat.metadata.change_log) pat.metadata.change_log = [];

                // Crucial: Preserve existing faculty members!
                if (!pat.faculty_members) pat.faculty_members = [];

                if (p.faculty_members && Array.isArray(p.faculty_members)) {
                    p.faculty_members.forEach(fm => {
                        const existingInfo = pat.faculty_members.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            pat.faculty_members.push(fm);
                        }
                    });
                }

                if (!pat.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    pat.faculty_members.push({ faculty_id });
                }

                if (p.students && Array.isArray(p.students)) {
                    pat.students = p.students;
                }
                if (p.external_inventors && Array.isArray(p.external_inventors)) {
                    pat.external_inventors = p.external_inventors;
                }

                Object.assign(pat, updateData);
                pat.metadata.change_log.push(logEntry);
                await pat.save();
            } else {
                const patPayload = Object.assign({}, updateData, {
                    patent_id: generateId('PAT'),
                    faculty_members: p.faculty_members && p.faculty_members.length > 0 ? p.faculty_members : [{ faculty_id }],
                    students: p.students || [],
                    external_inventors: p.external_inventors || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!patPayload.faculty_members.some(m => m.faculty_id === faculty_id)) {
                    patPayload.faculty_members.push({ faculty_id });
                }

                await Patent.create(patPayload);
            }
        }

        // 7. Awards
        const awards = formData.research?.awards || [];
        for (const a of awards) {
            const name = a.award_name || a.name_of_award;
            if (!name) continue;
            const aid = a.award_id;

            let act = null;
            if (aid) {
                act = await FacultyActivity.findOne({ activity_id: aid, type: 'award', faculty_id: faculty_id });
            }
            if (!act) {
                // SMART MERGE for Awards
                act = await FacultyActivity.findOne({
                    name_of_award: name,
                    type: 'award'
                    // Removed faculty_id check
                });

                if (act) {
                    console.log(`[SMART MERGE] Found existing award "${name}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                type: 'award',
                department_id: deptId,
                faculty_id: faculty_id,
                name_of_award: name,
                awarding_agency: a.awarding_agency || a.agency,
                date_of_award: parseDate(a.date_of_award || a.date),
                link: a.evidence_link || a.link,
                academic_year: a.academic_year || ay,
                name_of_organisation: a.name_of_organisation,
                monetary_value: parseNumber(a.monetary_value),
                year: parseNumber(a.year),
                category_of_award: a.category_of_award,
                type_of_award: a.type_of_award
            };

            let changeDesc = "Synced from APAR";
            if (act) {
                changeDesc = computeChanges(act, updateData);
            }

            const logEntry = {
                action: act ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (act) {
                if (!act.metadata) act.metadata = {};
                if (!act.metadata.change_log) act.metadata.change_log = [];

                if (!act.faculty_recipients) act.faculty_recipients = [];

                if (a.faculty_recipients && Array.isArray(a.faculty_recipients)) {
                    a.faculty_recipients.forEach(fm => {
                        const existingInfo = act.faculty_recipients.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            act.faculty_recipients.push(fm);
                        }
                    });
                }

                if (!act.faculty_recipients.some(m => m.faculty_id === faculty_id)) {
                    act.faculty_recipients.push({ faculty_id });
                }

                if (a.student_recipients && Array.isArray(a.student_recipients)) {
                    act.student_recipients = a.student_recipients;
                }
                if (a.external_recipients && Array.isArray(a.external_recipients)) {
                    act.external_recipients = a.external_recipients;
                }

                Object.assign(act, updateData);
                act.metadata.change_log.push(logEntry);
                await act.save();
            } else {
                const awardPayload = Object.assign({}, updateData, {
                    activity_id: generateId('AWD'),
                    faculty_recipients: a.faculty_recipients && a.faculty_recipients.length > 0 ? a.faculty_recipients : [{ faculty_id }],
                    student_recipients: a.student_recipients || [],
                    external_recipients: a.external_recipients || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!awardPayload.faculty_recipients.some(m => m.faculty_id === faculty_id)) {
                    awardPayload.faculty_recipients.push({ faculty_id });
                }

                await FacultyActivity.create(awardPayload);
            }
        }


        // 8. FDPs and Workshops
        const fdps = [...(formData.research?.fdps || []), ...(formData.research?.workshops || [])];
        for (const f of fdps) {
            const title = f.program_title || f.title;
            if (!title) continue;
            // FDPs in APAR schema don't show ID field explicitly in my previous view but they should ideally
            // Assuming activity_id for now if it exists elsewhere, else generic match
            // Checking APAR schema: fdps: [{ ... }] - no ID visible in snippet
            // But let's check title match primarily for FDPs as ID is likely missing in schema

            let act = await FacultyActivity.findOne({
                program_title: title,
                type: 'fdp'
                // Removed faculty_id check to allow discovering unlinked duplicates
            });

            if (act) {
                console.log(`[SMART MERGE] Found existing FDP "${title}". Merging user ${faculty_id} into it.`);
            }

            const updateData = {
                type: 'fdp',
                department_id: deptId,
                faculty_id: faculty_id,
                program_title: title,
                duration_days: parseNumber(f.duration_days),
                start_date: parseDate(f.start_date),
                end_date: parseDate(f.end_date),
                venue: f.venue,
                organising_body: f.organising_body || f.organizer,
                type_of_program: f.type_of_program,
                level: f.level,
                mode: f.mode,
                funding_agency: f.funding_agency,
                certificate_link: f.certificate_link,
                academic_year: f.academic_year || ay,
                outcome: f.outcome,
                remarks: f.remarks,
                link: f.link
            };

            let changeDesc = "Synced from APAR";
            if (act) {
                changeDesc = computeChanges(act, updateData);
            }

            const logEntry = {
                action: act ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (act) {
                if (!act.metadata) act.metadata = {};
                if (!act.metadata.change_log) act.metadata.change_log = [];

                if (!act.faculty_participants) act.faculty_participants = [];

                if (f.faculty_participants && Array.isArray(f.faculty_participants)) {
                    f.faculty_participants.forEach(fm => {
                        const existingInfo = act.faculty_participants.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            act.faculty_participants.push(fm);
                        }
                    });
                }

                if (f.external_participants && Array.isArray(f.external_participants)) {
                    act.external_participants = f.external_participants;
                }

                Object.assign(act, updateData);
                act.metadata.change_log.push(logEntry);
                await act.save();
            } else {
                const fdpPayload = Object.assign({}, updateData, {
                    activity_id: generateId('FDP'),
                    faculty_participants: f.faculty_participants || [],
                    external_participants: f.external_participants || [],
                    metadata: { change_log: [logEntry] }
                });
                await FacultyActivity.create(fdpPayload);
            }
        }

        // 9. E-Content
        const econtent = formData.research?.e_content || [];
        for (const e of econtent) {
            const name = e.name_of_module;
            if (!name) continue;
            const eid = e.econtent_id;

            let act = null;
            if (eid) {
                act = await FacultyActivity.findOne({ activity_id: eid, type: 'econtent', faculty_id: faculty_id });
            }
            if (!act) {
                // SMART MERGE for E-Content
                act = await FacultyActivity.findOne({
                    name_of_module: name,
                    type: 'econtent'
                    // Removed faculty_id check
                });

                if (act) {
                    console.log(`[SMART MERGE] Found existing E-content "${name}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                type: 'econtent',
                department_id: deptId,
                faculty_id: faculty_id,
                name_of_module: name,
                type_of_content: e.type_of_content,
                platform: e.platform,
                date_of_launching: parseDate(e.date_of_launching),
                academic_year: e.academic_year || ay,
                link: e.link,
                course_id: e.course_id,
                platform_type: e.platform_type,
                target_audience: e.target_audience,
                duration_hours: parseNumber(e.duration_hours),
                learning_outcome: e.learning_outcome
            };

            let changeDesc = "Synced from APAR";
            if (act) {
                changeDesc = computeChanges(act, updateData);
            }

            const logEntry = {
                action: act ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (act) {
                if (!act.metadata) act.metadata = {};
                if (!act.metadata.change_log) act.metadata.change_log = [];

                Object.assign(act, updateData);
                act.metadata.change_log.push(logEntry);
                await act.save();
            } else {
                await FacultyActivity.create({
                    ...updateData,
                    activity_id: generateId('ECONT'),
                    metadata: { change_log: [logEntry] }
                });
            }
        }

        // 10. Faculty Visits
        const visits = formData.research?.faculty_visits || [];
        for (const v of visits) {
            const title = v.title;
            if (!title) continue;
            const vid = v.visit_id;

            let act = null;
            if (vid) {
                act = await FacultyActivity.findOne({ activity_id: vid, type: 'visit', faculty_id: faculty_id });
            }
            if (!act) {
                // SMART MERGE for Faculty Visits
                act = await FacultyActivity.findOne({
                    title: title,
                    type: 'visit'
                    // Removed faculty_id check
                });

                if (act) {
                    console.log(`[SMART MERGE] Found existing Visit "${title}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                type: 'visit',
                department_id: deptId,
                faculty_id: faculty_id,
                title: v.title,
                organisation_name: v.organisation_name,
                visit_type: v.visit_type,
                purpose: v.purpose,
                start_date: parseDate(v.start_date),
                end_date: parseDate(v.end_date),
                academic_year: v.academic_year || ay,
                link: v.link,
                location: v.location
            };

            let changeDesc = "Synced from APAR";
            if (act) {
                changeDesc = computeChanges(act, updateData);
            }

            const logEntry = {
                action: act ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (act) {
                if (!act.metadata) act.metadata = {};
                if (!act.metadata.change_log) act.metadata.change_log = [];

                Object.assign(act, updateData);
                act.metadata.change_log.push(logEntry);
                await act.save();
            } else {
                await FacultyActivity.create({
                    ...updateData,
                    activity_id: generateId('VISIT'),
                    metadata: { change_log: [logEntry] }
                });
            }
        }

        // 11. Collaborations
        const collaborations = formData.research?.collaborations || [];
        for (const c of collaborations) {
            const title = c.title_of_activity || c.title;
            if (!title) continue;
            const cid = c.activity_id;

            let col = null;
            if (cid) {
                col = await Collaboration.findOne({ collaboration_id: cid, type: 'activity', 'faculty_associations.faculty_id': faculty_id });
            }
            if (!col) {
                // SMART MERGE for Collaborations
                col = await Collaboration.findOne({
                    title_of_activity: title,
                    type: 'activity'
                    // Removed faculty_associations check
                });

                if (col) {
                    console.log(`[SMART MERGE] Found existing Collaboration "${title}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                title: title,
                title_of_activity: title,
                type: 'activity',
                department_id: deptId,
                name_of_collaborative_agency: c.name_of_collaborative_agency,
                type_of_activity: c.type_of_activity,
                nature_of_activity: c.nature_of_activity,
                start_date: parseDate(c.start_date),
                end_date: parseDate(c.end_date),
                academic_year: c.academic_year || ay,
                link: c.link,
                number_of_participants: parseNumber(c.number_of_participants),
                source_of_financial_support: c.source_of_financial_support,
                funding_amount: parseNumber(c.funding_amount),
                year: parseNumber(c.year),
                duration: c.duration,
                nature_of_collaboration: c.nature_of_collaboration,
                level: c.level
            };

            let changeDesc = "Synced from APAR";
            if (col) {
                changeDesc = computeChanges(col, updateData);
            }

            const logEntry = {
                action: col ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (col) {
                if (!col.metadata) col.metadata = {};
                if (!col.metadata.change_log) col.metadata.change_log = [];

                if (!col.faculty_associations) col.faculty_associations = [];

                if (c.faculty_associations && Array.isArray(c.faculty_associations)) {
                    c.faculty_associations.forEach(fm => {
                        const existingInfo = col.faculty_associations.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            col.faculty_associations.push(fm);
                        }
                    });
                }

                if (!col.faculty_associations.some(m => m.faculty_id === faculty_id)) {
                    col.faculty_associations.push({ faculty_id, role: 'Participant' });
                }

                if (c.student_associations && Array.isArray(c.student_associations)) {
                    col.student_associations = c.student_associations;
                }
                if (c.external_contributors && Array.isArray(c.external_contributors)) {
                    col.external_contributors = c.external_contributors;
                }

                Object.assign(col, updateData);
                col.metadata.change_log.push(logEntry);
                await col.save();
            } else {
                const colPayload = Object.assign({}, updateData, {
                    collaboration_id: generateId('COL'),
                    faculty_associations: c.faculty_associations && c.faculty_associations.length > 0 ? c.faculty_associations : [{ faculty_id, role: 'Participant' }],
                    student_associations: c.student_associations || [],
                    external_contributors: c.external_contributors || [],
                    metadata: { change_log: [logEntry] }
                });

                if (!colPayload.faculty_associations.some(m => m.faculty_id === faculty_id)) {
                    colPayload.faculty_associations.push({ faculty_id, role: 'Participant' });
                }

                await Collaboration.create(colPayload);
            }
        }

        // 12. PhD Supervision
        const phds = formData.research?.phd_supervision || formData.research?.phd_guidance || [];
        for (const p of phds) {
            const studentName = p.scholar_name || p.student_name;
            if (!studentName) continue;
            const did = p.defence_id;

            let def = null;
            if (did) {
                def = await PhdDefence.findOne({ defence_id: did, supervisor_id: faculty_id });
            }
            if (!def) {
                // SMART MERGE for PhD
                def = await PhdDefence.findOne({
                    student_name: studentName,
                    // Removed supervisor check to allow co-supervisors to merge
                });

                if (def) {
                    console.log(`[SMART MERGE] Found existing PhD defence for "${studentName}". Merging user ${faculty_id} into it.`);
                }
            }

            const updateData = {
                department_id: deptId,
                student_name: studentName,
                supervisor_id: faculty_id,
                supervisor_name: formData.personal?.name || 'Unknown',
                thesis_title: p.thesis_title || p.title || 'Untitled Thesis',
                enrollment_no: p.enrollment_no || 'N/A',
                date_of_defence: parseDate(p.date_of_award || p.submission_date) || new Date(),
                result_outcome: p.status || 'Ongoing',
                thesis_type: p.thesis_type || 'Full-time',
                academic_year: ay,
                link: p.link,
                date_of_result_notification: parseDate(p.date_of_result_notification)
            };

            let changeDesc = "Synced from APAR";
            if (def) {
                changeDesc = computeChanges(def, updateData);
            }

            const logEntry = {
                action: def ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: changeDesc
            };

            if (def) {
                if (!def.metadata) def.metadata = {};
                if (!def.metadata.change_log) def.metadata.change_log = [];

                if (p.co_supervisors && Array.isArray(p.co_supervisors)) {
                    def.co_supervisors = p.co_supervisors;
                }
                if (p.committee_members && Array.isArray(p.committee_members)) {
                    def.committee_members = p.committee_members;
                }
                if (p.external_examiners && Array.isArray(p.external_examiners)) {
                    def.external_examiners = p.external_examiners;
                }

                Object.assign(def, updateData);
                def.metadata.change_log.push(logEntry);
                await def.save();
            } else {
                const phdPayload = Object.assign({}, updateData, {
                    defence_id: generateId('PHD'),
                    student_id: p.student_id || generateId('STU'),
                    co_supervisors: p.co_supervisors || [],
                    committee_members: p.committee_members || [],
                    external_examiners: p.external_examiners || [],
                    metadata: { change_log: [logEntry] }
                });
                await PhdDefence.create(phdPayload);
            }
        }

        // 13. MoUs
        const mous = formData.research?.mous || [];
        for (const m of mous) {
            const title = m.title || m.organisation_name;
            if (!title) continue;
            const mid = m.mou_id;

            let col = null;
            if (mid) {
                col = await Collaboration.findOne({ collaboration_id: mid, type: 'mou', department_id: deptId });
            }
            if (!col) {
                // SMART MERGE for MoUs
                col = await Collaboration.findOne({
                    organisation_name: m.organisation_name,
                    type: 'mou',
                    department_id: deptId
                    // Removed faculty_associations check
                });

                if (col) {
                    console.log(`[SMART MERGE] Found existing MoU "${m.organisation_name}". Merging user ${faculty_id} into it.`);
                }
            }

            // Normalize activities_under_mou to array of objects expected by Collaboration model
            let mouActivities = m.activities_under_mou;
            if (typeof mouActivities === 'string') {
                try {
                    mouActivities = JSON.parse(mouActivities);
                } catch (e) {
                    mouActivities = [{ activity_title: mouActivities }];
                }
            }
            if (Array.isArray(mouActivities) && mouActivities.length > 0 && typeof mouActivities[0] === 'string') {
                mouActivities = mouActivities.map(a => ({ activity_title: a }));
            }

            const updateData = {
                title: title,
                type: 'mou',
                department_id: deptId,
                organisation_name: m.organisation_name,
                type_of_mou: m.type_of_mou,
                year_of_signing: parseNumber(m.year_of_signing),
                purpose: m.purpose,
                activities_under_mou: mouActivities,
                start_date: parseDate(m.start_date),
                end_date: parseDate(m.end_date),
                level: m.level,
                link: m.link,
                academic_year: m.academic_year || ay
            };

            const logEntry = {
                action: col ? 'updated' : 'created',
                user_id: faculty_id,
                timestamp: new Date(),
                changes: "Synced from APAR"
            };

            if (col) {
                if (!col.faculty_associations) col.faculty_associations = [];

                if (m.faculty_associations && Array.isArray(m.faculty_associations)) {
                    m.faculty_associations.forEach(fm => {
                        const existingInfo = col.faculty_associations.find(m => m.faculty_id === fm.faculty_id);
                        if (!existingInfo) {
                            col.faculty_associations.push(fm);
                        }
                    });
                }

                if (!col.faculty_associations.some(m => m.faculty_id === faculty_id)) {
                    col.faculty_associations.push({ faculty_id, role: 'Coordinator' });
                }

                if (m.student_associations && Array.isArray(m.student_associations)) {
                    col.student_associations = m.student_associations;
                }
                if (m.external_contributors && Array.isArray(m.external_contributors)) {
                    col.external_contributors = m.external_contributors;
                }

                Object.assign(col, updateData);
                col.metadata.change_log.push(logEntry);
                await col.save();
            } else {
                const mouPayload = Object.assign({}, updateData, {
                    collaboration_id: generateId('MOU'),
                    faculty_associations: m.faculty_associations && m.faculty_associations.length > 0 ? m.faculty_associations : [{ faculty_id, role: 'Coordinator' }],
                    student_associations: m.student_associations || [],
                    external_contributors: m.external_contributors || [], // Added external
                    metadata: { change_log: [logEntry] }
                });

                if (!mouPayload.faculty_associations.some(m => m.faculty_id === faculty_id)) {
                    mouPayload.faculty_associations.push({ faculty_id, role: 'Coordinator' });
                }

                await Collaboration.create(mouPayload);
            }
        }

        // Notify HOD and IQAC Head
        // await notifyHeads({
        //    sender: faculty_id,
        //    type: 'IQAC_UPDATE',
        //    title: 'IQAC Monthly Data Updated',
        //    message: `Faculty Member ${facultyUser?.name || faculty_id} synced APAR research data to IQAC for Academic Year ${ay}.`,
        //    link: '/app/tables/journal_research_papers', // Example link to see journals
        //    department_id: deptId
        // });

        // -------------------------------------------------------------------------
        // REAL-TIME UPDATE SOCKET EMISSION
        // -------------------------------------------------------------------------
        // Use the shared socket helper so we emit to the correct room even if
        // faculty_id is a Mongo ObjectId (frontend joins with resolved readable IDs).
        const { emitAparDataUpdated } = await import('../config/socket.js');

        emitAparDataUpdated(faculty_id, ay, {
            source: 'IQAC_SYNC',
            message: 'Your research data has been synced with IQAC.'
        });

        // -------------------------------------------------------------------------
        // COLLABORATIVE SYNC: Notify other faculty involved in entries
        // -------------------------------------------------------------------------
        try {
            const { triggerAparAutoSyncMultiple } = await import('../utils/apar-auto-sync.js');
            const { emitCrossFacultyUpdate } = await import('../config/socket.js');
            const { Notification } = await import('../models/notification.model.js');

            // Aggregate all faculty IDs from all updated entries (journals, projects, etc.)
            let collaboratorIds = new Set();

            // Helper to collect IDs
            // Helper to collect IDs
            const collectIds = (items, idKey = 'faculty_id') => {
                if (!items) return;
                items.forEach(item => {
                    // Check all possible faculty array fields across different schemas
                    [
                        'faculty_involved',
                        'faculty_associations',
                        'faculty_members',
                        'faculty_ids',
                        'faculty_participants',
                        'faculty_recipients'
                    ].forEach(field => {
                        if (item[field] && Array.isArray(item[field])) {
                            item[field].forEach(f => {
                                // Handle both object wrapper { faculty_id: "..." } and direct string "..."
                                const fId = f[idKey] || (typeof f === 'string' ? f : null);
                                if (fId && fId !== faculty_id) collaboratorIds.add(fId);
                            });
                        }
                    });
                });
            };

            collectIds(formData.research?.journals);
            collectIds(formData.research?.conferences);
            collectIds(formData.research?.projects);
            collectIds(formData.research?.patents);
            collectIds(formData.research?.consultancy);

            const uniqueCollaborators = Array.from(collaboratorIds);

            if (uniqueCollaborators.length > 0) {
                console.log(`[COLLAB] Syncing updates to collaborators: ${uniqueCollaborators.join(', ')}`);

                // 1. Trigger Auto-Sync for them (updates their DRAFT/Form)
                await triggerAparAutoSyncMultiple(uniqueCollaborators, ay, {
                    type: 'collaborative_update',
                    metadata: { created_by: faculty_id }
                });

                // 2. Send Notifications  
                for (const colleagueId of uniqueCollaborators) {
                    emitCrossFacultyUpdate(colleagueId, ay, {
                        action: `Colleague ${facultyUser?.name || faculty_id} updated shared research data.`,
                        submittedBy: facultyUser?.name || faculty_id
                    });

                    // Persistent Notification
                    await Notification.create({
                        recipient: colleagueId,
                        type: 'IQAC_UPDATE',
                        title: 'Collaborative Data Update',
                        message: `Shared research data was updated by ${facultyUser?.name || 'a colleague'}. Your APAR form has been synced.`,
                        link: '/apar-form',
                        isRead: false
                    });
                }
            }
        } catch (collabErr) {
            console.error("Collaborative sync failed:", collabErr);
        }

        return res.status(200).json(new ApiResponse(200, {}, "Data saved to IQAC successfully"));
    } catch (err) {
        console.error("Save Monthly Data Error:", err);
        throw new ApiError(400, `Failed to sync monthly data: ${err.message}`);
    }
});

// === Faculty Actions ===



// Helper to sync IQAC data into APAR Form
// Helper to normalize Academic Year to YYYY-YY format
// Helper to normalize Academic Year to YYYY-YY format
const normalizeAY = (ay) => {
    if (!ay || typeof ay !== 'string') return ay;
    const cleanAy = ay.trim();
    const parts = cleanAy.split(/[\s-]+/); // Split by space or dash
    if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
        return `${parts[0]}-${parts[1].substring(2)}`;
    }
    return cleanAy;
};

// Helper to sync IQAC data into APAR Form
const syncIqacToAparForm = async (form, faculty_id, ay) => {
    // Normalization logic for IQAC sync
    // IQAC might use 2024-2025 or 2024-25. We need to handle variants.
    const startYear = ay.split('-')[0];
    const endYear = ay.split('-')[1];

    // Create variants to query IQAC (IQAC might store as YYYY-YYYY or YYYY-YY or Number)
    // We assume current AY is the canonical one stored in form (normalized).
    // ... logic continues ...

    // Log the ID being used for sync to help user verify
    console.log(`[APAR SYNC] DEBUG: Pre-fetching IQAC data for Faculty ID: "${faculty_id}" (AY: ${ay})`);


    if (!form.research) form.research = {};
    const research = form.research;
    let modified = false;

    // Years for Publication matching (e.g. 2023, 2024)
    let years = ay ? ay.split('-').map(y => parseInt(y)).filter(n => !isNaN(n)) : [];
    // Normalize short years in filtering (e.g. "27" -> 2027)
    years = years.map(y => (y < 100 ? 2000 + y : y));
    // Remove duplicates
    years = [...new Set(years)];

    // Academic Year Variants for string matching (e.g. "2026-2027" vs "2026-27")
    let ayVariants = [ay]; // Start with the requested format
    if (years.length >= 2) {
        const start = years[0];
        const end = years[years.length - 1]; // Use last parsed year as end
        const endShort = end % 100;

        const longFormat = `${start}-${end}`;     // "2026-2027"
        const shortFormat = `${start}-${endShort}`; // "2026-27"

        ayVariants = [longFormat, shortFormat];
    }
    // Remove duplicates
    ayVariants = [...new Set(ayVariants)];



    const queryAy = { academic_year: { $in: ayVariants } }; // Flexible AY query

    // ... inside the try block
    // We will inject logs specifically around the queries

    /* 
       Note: The original code defined 'merge' function here. 
       I am injecting logs before the try block starts essentially. 
       But I need to Replace the block carefully.
    */

    // ... redefine merge to include logging if helpful, or just log query results below.

    // Generic Merger with Enhanced Matching
    const merge = (sectionKey, iqacList, idField, type) => {
        if (!typeof research[sectionKey] === 'object') research[sectionKey] = [];
        const oldSection = research[sectionKey] || [];

        // Map valid IQAC items to clean POJOs
        const newSection = iqacList.map(iqacItem => {
            const iqacId = iqacItem[idField];
            // Destructure to remove Mongoose internals
            const { _id, metadata, __v, ...cleanItem } = iqacItem;

            // Ensure ID is present
            cleanItem[idField] = iqacId;

            return cleanItem;
        });

        // Determine modification status
        // If lengths differ, or if we have content (assuming updates), mark as modified
        if (oldSection.length !== newSection.length) {
            modified = true;
        } else if (newSection.length > 0) {
            // Optimization: Could check deep equality, but assuming sync update is intended
            modified = true;
        }

        // Direct replacement with POJO array
        research[sectionKey] = newSection;
    };

    // Create case-insensitive ID query
    const idQuery = { $regex: new RegExp(`^${faculty_id}$`, 'i') };

    try {
        // 1. Journals
        // 1. Journals
        const journals = await Publication.find({
            type: 'journal',
            $or: [{ 'faculty_members.faculty_id': idQuery }, { 'faculty_ids': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        // pre-map to ensure common fields exist for matcher
        const journalsMapped = journals.map(j => ({
            ...j,
            title: j.title || j.name_of_journal,
            paper_id: j.paper_id || j.publication_id
        }));
        merge('journals', journalsMapped, 'paper_id', 'journals');

        // 2a. Conferences (Paper Publishing)
        // 2a. Conferences (Paper Publishing)
        const conferences = await Publication.find({
            type: 'conference',
            $or: [{ 'faculty_members.faculty_id': idQuery }, { 'faculty_ids': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        const confMapped = conferences.map(c => ({
            ...c,
            title_of_paper: c.title || c.title_of_paper, // Ensure keys match frontend expectation
            paper_id: c.paper_id || c.publication_id
        }));
        merge('conferences', confMapped, 'paper_id', 'conferences');

        // 2b. Participation in Conferences (Paper Presentation)
        // This is distinct from just publishing. Checking for 'Presentation' nature if available, 
        // or assuming all conference papers imply presentation for now as per user request context.
        // The frontend expects this in 'conference_participation' key probably?
        // Checking APAR form structure... usually it's separate. 
        // For now, I will reuse the conference list but map it to 'conference_participation' 
        // if user has a separate section for it.
        const presentationMapped = conferences.map(c => ({
            ...c,
            title_of_paper: c.title || c.title_of_paper,
            name_of_conference: c.name_of_conference,
            date: c.date || c.year_of_publication,
            organizing_agency: c.organizer || c.publisher,
            level: c.conference_level
        }));
        merge('conference_participation', presentationMapped, 'paper_id', 'default');

        // 3. Books
        const books = await Publication.find({
            type: 'book',
            $or: [{ 'faculty_members.faculty_id': idQuery }, { 'faculty_ids': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        const booksMapped = books.map(b => ({
            ...b,
            faculty_ids: b.faculty_members ? b.faculty_members : [],
            student_ids: b.students ? b.students : []
        }));
        merge('books', booksMapped, 'publication_id', 'books');

        // 4. Projects (Funding)
        const projects = await ResearchProject.find({
            type: 'funding',
            $or: [{ 'faculty_involved.faculty_id': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        merge('projects', projects, 'project_id', 'projects');

        // 5. Consultancy
        const consultancy = await ResearchProject.find({
            type: 'consultancy',
            $or: [{ 'faculty_involved.faculty_id': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        const consMapped = consultancy.map(c => ({
            ...c,
            title: c.title || c.name_of_project,
            consultancy_id: c.project_id
        }));
        merge('consultancy', consMapped, 'consultancy_id', 'consultancy');

        // console.log(`[PATENT DEBUG] Querying with:`, {
        //     idQuery,
        //     startYear,
        //     endYear,
        //     ayVariants
        // });

        const patents = await Patent.find({
            $or: [{ 'faculty_members.faculty_id': idQuery }],
            status: { $in: ['Filed', 'Published', 'Granted'] },
            academic_year: { $in: ayVariants }
        }).lean();

        console.log(`[PATENT DEBUG] Found ${patents.length} patents:`, JSON.stringify(patents, null, 2));

        merge('patents', patents, 'patent_id', 'patents');

        // 7. Awards
        const awards = await FacultyActivity.find({
            type: 'award',
            $or: [{ faculty_id: idQuery }, { 'faculty_recipients.faculty_id': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        const awdMapped = awards.map(a => ({ ...a, award_id: a.activity_id }));
        merge('awards', awdMapped, 'award_id', 'awards');

        // 8. FDPs
        const fdps = await FacultyActivity.find({
            type: 'fdp',
            $or: [{ faculty_id: idQuery }, { 'faculty_participants.faculty_id': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        // FDP matcher falls back to default Title match
        merge('fdps', fdps, 'activity_id', 'default');

        // 9. E-Content
        const econtent = await FacultyActivity.find({ type: 'econtent', faculty_id: idQuery, academic_year: { $in: ayVariants } }).lean();
        const econtMapped = econtent.map(e => ({ ...e, econtent_id: e.activity_id }));
        merge('e_content', econtMapped, 'econtent_id', 'default');

        // 10. Visits
        const visits = await FacultyActivity.find({ type: 'visit', faculty_id: idQuery, academic_year: { $in: ayVariants } }).lean();
        const visitsMapped = visits.map(v => ({ ...v, visit_id: v.activity_id }));
        merge('faculty_visits', visitsMapped, 'visit_id', 'default');

        // 11. Collaborations
        const collaborations = await Collaboration.find({ type: 'activity', 'faculty_associations.faculty_id': idQuery, academic_year: { $in: ayVariants } }).lean();
        const collMapped = collaborations.map(c => ({ ...c, activity_id: c.collaboration_id }));
        merge('collaborations', collMapped, 'activity_id', 'default');

        // 12. PhDs
        const phds = await PhdDefence.find({
            $or: [{ supervisor_id: idQuery }, { 'co_supervisors.co_supervisor_id': idQuery }],
            academic_year: { $in: ayVariants }
        }).lean();
        // PhD fallback uses thesis title by default logic
        merge('phd_supervision', phds, 'defence_id', 'default');

        // 13. MoUs
        const mous = await Collaboration.find({ type: 'mou', 'faculty_associations.faculty_id': idQuery, academic_year: { $in: ayVariants } }).lean();
        const mousMapped = mous.map(m => ({ ...m, mou_id: m.collaboration_id }));
        merge('mous', mousMapped, 'mou_id', 'default');

    } catch (e) {
        console.error("Error syncing IQAC to APAR:", e);
    }

    return modified;
};

const getForm = asyncHandler(async (req, res) => {
    let faculty_id = req.query.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    console.log(`[GET FORM] Input Faculty ID: ${faculty_id}`);
    faculty_id = await resolveToReadableId(faculty_id);
    console.log(`[GET FORM] Resolved Faculty ID: ${faculty_id}`);

    let ay = req.query.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);

    if (!faculty_id) {
        throw new ApiError(400, "Faculty ID is required");
    }

    let form;
    if (ay) {
        // Fetch user/faculty details for auto-population (needed for creation)
        const facultyProfile = await Faculty.findOne({ faculty_id });
        const userProfile = await User.findOne({ user_id: faculty_id });

        // Check if form exists first (User request)
        form = await AparForm.findOne({ faculty_id, ay });

        // IF form doesn't exist, create it + sync
        if (!form) {
            console.log(`[APAR] No form found for Faculty=${faculty_id}, AY=${ay}. Creating new draft.`);

            const newForm = new AparForm({
                faculty_id,
                ay,
                status: 'Draft',
                reporting_officer_id: userProfile?.reporting_officer_id,
                reviewing_officer_id: userProfile?.reviewing_officer_id,
                research: {},
                personal: {
                    department_id: req.user?.departmentId || '',
                    name: facultyProfile?.name,
                    email: facultyProfile?.email,
                    designation: facultyProfile?.designation,
                    date_of_birth: facultyProfile?.date_of_birth,
                    phone: facultyProfile?.phone,
                    qualification: facultyProfile?.qualification,
                    joining_date: facultyProfile?.joining_date
                }
            });

            // Sync data immediately
            await syncIqacToAparForm(newForm, faculty_id, ay);

            try {
                form = await newForm.save();
                console.log(`[APAR] New form created and saved for ${faculty_id} ${ay}`);
            } catch (err) {
                if (err.code === 11000) {
                    console.warn(`[APAR] Race condition detected for ${faculty_id} ${ay}. Fetching existing form.`);
                    form = await AparForm.findOne({ faculty_id, ay });
                    if (!form) throw err; // Should not happen if 11000
                } else {
                    throw err;
                }
            }
        }

        // Fetch it again if needed? No, new:true returns the doc.
        // Check if it was just created? 
        // With upsert, we don't know if it was inserted or found unless we check via rawResult (which mongoose wraps).
        // However, we generally want to sync IQAC data if it's new OR draft.

        if (form.status === 'Draft' || form.status === 'check_submit_status' || !form.status) {
            // ... strict sync logic below applies to both new and existing drafts ...
            // Just ensure we call sync.
            const modified = await syncIqacToAparForm(form, faculty_id, ay);

            // Check if personal info needs update (for existing drafts that missed it)
            if (facultyProfile) {
                if (!form.personal) form.personal = {};
                let pChanged = false;
                if (!form.personal.name && facultyProfile.name) { form.personal.name = facultyProfile.name; pChanged = true; }
                if (!form.personal.email && facultyProfile.email) { form.personal.email = facultyProfile.email; pChanged = true; }
                if (!form.personal.designation && facultyProfile.designation) { form.personal.designation = facultyProfile.designation; pChanged = true; }
                if (!form.personal.date_of_birth && facultyProfile.date_of_birth) { form.personal.date_of_birth = facultyProfile.date_of_birth; pChanged = true; }
                if (!form.personal.phone && facultyProfile.phone) { form.personal.phone = facultyProfile.phone; pChanged = true; }
                if (!form.personal.qualification && facultyProfile.qualification) { form.personal.qualification = facultyProfile.qualification; pChanged = true; }
                if (!form.personal.joining_date && facultyProfile.joining_date) { form.personal.joining_date = facultyProfile.joining_date; pChanged = true; }

                // Backfill Officers
                if (!form.reporting_officer_id && userProfile?.reporting_officer_id) { form.reporting_officer_id = userProfile.reporting_officer_id; pChanged = true; }
                if (!form.reviewing_officer_id && userProfile?.reviewing_officer_id) { form.reviewing_officer_id = userProfile.reviewing_officer_id; pChanged = true; }

                if (pChanged) form.markModified('personal');
            }

            if (modified || form.isModified('personal')) {
                form.markModified('research');
                await form.save();
            }
        }

    } else {
        // Find latest
        form = await AparForm.findOne({ faculty_id }).sort({ ay: -1, updatedAt: -1 });
    }

    return res.status(200).json(
        new ApiResponse(200, form ? form.toObject() : {}, "Form fetched successfully")
    );
});

const getFacultyHistory = asyncHandler(async (req, res) => {
    let faculty_id = req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");

    const forms = await AparForm.find({ faculty_id }).sort({ ay: -1 }).lean();
    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: normalizeAY(f.ay), // Ensure output is normalized
        status: f.status,
        timeline: f.timeline,
        history: f.history, // Include history array
        query_comment: f.query_comment || (f.remarks && f.remarks.query_comment),
        reporting_query: f.reporting_query,
        reviewing_query: f.reviewing_query,
        updatedAt: f.updatedAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "Faculty APAR history fetched"));
});

const checkDraftDuplicates = (data) => {
    const research = data.research || {};
    const sections = [
        { key: 'journals', title: 'title_of_paper' }, // APAR keys might vary, checking possible fields
        { key: 'conferences', title: 'title_of_paper' },
        { key: 'books', title: 'title_of_book' },
        { key: 'projects', title: 'title' },
        { key: 'consultancy', title: 'title' },
        { key: 'patents', title: 'title' },
        { key: 'awards', title: 'name_of_award' },
        { key: 'fdps', title: 'program_title' }
    ];

    for (const sec of sections) {
        const list = research[sec.key];
        if (Array.isArray(list) && list.length > 1) {
            const seen = new Set();
            for (const item of list) {
                const t = item[sec.title] || item.title || item.name_of_journal || item.program_title || item.name_of_award || item.title_of_book;
                if (t) {
                    const lower = t.toString().toLowerCase().trim();
                    if (seen.has(lower)) {
                        throw new ApiError(400, `Duplicate entry found in ${sec.key}: "${t}". Please remove duplicates.`);
                    }
                    seen.add(lower);
                }
            }
        }
    }
};

const saveForm = asyncHandler(async (req, res) => {
    let ay = req.body.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);
    let formData = req.body.formData;
    let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);

    if (!faculty_id) {
        throw new ApiError(400, "Faculty ID is required. Please sign in again.");
    }
    if (!ay) {
        throw new ApiError(400, "Academic Year (Ay) is required. Please ensure it is selected or filled in Part I.");
    }

    // Clean formData to replace "" with undefined for Dates/Numbers to avoid CastError
    if (formData) {
        console.log('[SAVE FORM DEBUG] Received Research Keys:', Object.keys(formData.research || {}));
        if (formData.research?.journals) {
            console.log('[SAVE FORM DEBUG] Raw Journals:', JSON.stringify(formData.research.journals, null, 2));
        }

        formData = cleanEmptyStrings(formData);

        if (formData.research?.journals) {
            console.log('[SAVE FORM DEBUG] Cleaned Journals:', JSON.stringify(formData.research.journals, null, 2));
        }

        // Check for internal duplicates in the draft data being saved
        checkDraftDuplicates({ research: formData.research });
    }

    // Check if form exists first to check status restrictions?
    const existing = await AparForm.findOne({ faculty_id, ay });
    if (existing && (existing.status === 'Submitted' || existing.status === 'Verified' || existing.status === 'Reviewed')) {
        if (existing.status !== 'Query Raised') {
            // Logic for submitted forms
        }
    }

    let form;
    try {
        form = await AparForm.findOneAndUpdate(
            { faculty_id, ay },
            {
                $set: {
                    personal: formData.personal,
                    teaching: formData.teaching,
                    research: formData.research,
                    corporate: formData.corporate,
                },
                $setOnInsert: {
                    status: 'Draft', // Ensure status is Draft on creation
                    "timeline.created_at": new Date()
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // If validation passed and it wasn't submitted, ensure it's Draft (for updates where status might be missing)
        if (form && !form.status) {
            form.status = 'Draft';
            await form.save();
        }
    } catch (dbError) {
        console.error("Save Draft DB Error:", dbError);
        throw new ApiError(400, `Failed to save draft: ${dbError.message}`);
    }

    // Sync with Faculty model
    try {
        await syncAparToFaculty(faculty_id, { ...formData, ay });
    } catch (syncError) {
        console.error("Sync to Faculty failed during saveForm:", syncError);
    }

    return res.status(200).json(
        new ApiResponse(200, form, "Form saved successfully")
    );
});

const submitForm = asyncHandler(async (req, res) => {
    const ay = req.body.ay || req.user?.academicYear;
    const formData = req.body.formData;
    let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");
    if (!ay) throw new ApiError(400, "Academic Year (Ay) is required");

    const form = await AparForm.findOneAndUpdate(
        { faculty_id, ay },
        {
            $set: {
                personal: formData.personal,
                teaching: formData.teaching,
                research: formData.research,
                corporate: formData.corporate,
                status: "Submitted",
                "timeline.submitted_at": new Date()
            },
            $push: {
                history: {
                    action: "Submitted",
                    by: "Faculty",
                    date: new Date(),
                    comment: "Form submitted by faculty"
                }
            }
        },
        { new: true, upsert: true }
    );

    // Sync with Faculty model
    try {
        await syncAparToFaculty(faculty_id, { ...formData, ay });
    } catch (syncError) {
        console.error("Sync to Faculty failed during submitForm:", syncError);
    }

    // Notifications
    try {
        const user = await User.findOne({ user_id: faculty_id });
        if (user && user.reporting_officer_id) {
            // await createNotification({
            //     recipient: user.reporting_officer_id,
            //     sender: faculty_id,
            //     type: 'APAR_SUBMISSION',
            //     title: 'New APAR Submission',
            //     message: `Faculty ${user.name || faculty_id} has submitted their APAR for AY ${ay}.`,
            //     link: '/apar/reporting'
            // });
        }

        // 🚀 Notify IQAC HEAD as well - DISABLED
        // await notifyHeads({
        //     sender: faculty_id,
        //     type: 'APAR_SUBMISSION',
        //     title: 'APAR Form Submitted',
        //     message: `Faculty ${user?.name || faculty_id} (${user?.department_id || ''}) has submitted their APAR for Academic Year ${ay}.`,
        //     link: `/apar/dashboard`, // Adjust link as needed for IQAC head to view status
        //     department_id: user?.department_id
        // });
    } catch (notifErr) {
        console.error("APAR submission notification failed:", notifErr);
    }

    return res.status(200).json(
        new ApiResponse(200, form, "Form submitted successfully")
    );
});

// === Reporting Officer Actions ===

const getPendingReporting = asyncHandler(async (req, res) => {
    const { ay } = req.query;
    let reportingOfficerId = req.user.userId || req.user.faculty_id || req.user.id;
    reportingOfficerId = await resolveToReadableId(reportingOfficerId);

    // Use both readable and Mongo ID to catch any inconsistent data
    const possibleOfficerIds = [reportingOfficerId];
    if (req.user?.id && req.user.id !== reportingOfficerId) possibleOfficerIds.push(req.user.id);
    if (req.user?.sub && req.user.sub !== reportingOfficerId) possibleOfficerIds.push(req.user.sub);

    console.log(`[REPORTING VIEW] Checking assignments for Officer IDs: ${possibleOfficerIds.join(', ')}`);

    // Direct query to User model instead of helper to support multiple IDs
    const assignedUsers = await User.find({ reporting_officer_id: { $in: possibleOfficerIds } });
    const assignedUserIds = assignedUsers.map(u => u.user_id);
    console.log(`[REPORTING VIEW] Found ${assignedUsers.length} assigned users: ${assignedUserIds.join(', ')}`);


    if (!assignedUserIds.length) {
        console.log(`[REPORTING VIEW] No assigned officers found for ${reportingOfficerId}`);
        return res.status(200).json(new ApiResponse(200, [], "No assigned officers found"));
    }

    const query = {
        faculty_id: { $in: assignedUserIds }
    };

    if (req.query.archive === 'true') {
        // Archive: Show all forms regardless of status (or maybe just completed ones?)
        // User said: "make it availabel to him as archive and only in view form"
        // Let's show everything for now, or maybe filter out 'Draft' if we want strictly submitted history.
        // But typically archive implies past/completed.
        // Let's include everything except maybe 'Draft' if they haven't submitted?
        // Actually, if it's assigned, they should see what's submitted.
        query.status = { $ne: 'Draft' };
    } else {
        // Pending Action: Only forms needing attention
        query.status = { $in: ['Submitted', 'Verified', 'Reviewed', 'Query Raised', 'Forwarded by Reporting officer', 'Query Raised by Reviewing officer'] };
    }

    if (ay) query.ay = ay;

    console.log(`[REPORTING VIEW] Querying Forms:`, JSON.stringify(query));
    const forms = await AparForm.find(query).sort({ updatedAt: -1 }).lean();
    console.log(`[REPORTING VIEW] Forms found: ${forms.length}`);

    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: f.ay,
        name: f.personal?.name || 'Unknown',
        designation: f.personal?.designation || '',
        dept_name: f.personal?.department_id || '',
        status: f.status,
        query_comment: f.query_comment || (f.remarks && f.remarks.query_comment),
        reviewing_query: f.reviewing_query,
        date: f.updatedAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "Fetched all pending forms"));
});

const submitReportingAssessment = asyncHandler(async (req, res) => {
    // reporting_officer_id comes from the authenticated user (req.user)
    // assuming auth middleware populates req.user
    const reportingKey = req.user?.id || req.body.reporting_officer_id;

    const { faculty_id, ay, assessment, status } = req.body;
    // status can be 'Verified', 'Reporting Officer Forwarded', 'Query Raised'

    const updateFields = {
        assessment: assessment,
        status: status,
        "timeline.reporting_reviewed_at": new Date()
    };

    // If a query comment is provided, store it
    if (req.body.query_comment) {
        updateFields.query_comment = req.body.query_comment;
        updateFields.reporting_query = req.body.query_comment;
    }

    // Logic to reset timeline if Query Raised
    if (status && status.includes('Query')) {
        // If Reporting Officer raises query, it goes back to faculty (step 1 redo?)
        // The user said "db timeline shoulds to initiated value". 
        // We will clear reporting_reviewed_at and reviewing_reviewed_at 
        // so it looks like it hasn't passed this stage yet.
        updateFields["timeline.reporting_reviewed_at"] = null;
        updateFields["timeline.reviewing_reviewed_at"] = null;
        // Ideally we might keep submitted_at so we know when it started, 
        // but if it's "initiated value", maybe they want that cleared too?
        // Usually 'initiated' means started, so submitted_at should stay or just be there.
        // Let's assume we clear the *approval* flow steps.
    } else {
        // Only set this if NOT a query (i.e. successful forward)
        updateFields["timeline.reporting_reviewed_at"] = new Date();
    }

    if (reportingKey) {
        updateFields.reporting_officer_id = reportingKey;
    }

    const historyEvent = {
        action: status,
        by: "Reporting Officer",
        date: new Date(),
        comment: req.body.query_comment || (status === 'Verified' ? 'Verified by Reporting Officer' : status)
    };

    const form = await AparForm.findOneAndUpdate(
        { faculty_id, ay },
        {
            $set: updateFields,
            $push: { history: historyEvent }
        },
        { new: true }
    );

    if (!form) {
        throw new ApiError(404, "APAR Form not found for the given Faculty ID and Academic Year");
    }

    // Sync with Faculty model using the stored form data
    await syncAparToFaculty(faculty_id, {
        ...form.toObject(),
        ay: form.ay,
        formData: {
            personal: form.personal,
            teaching: form.teaching,
            research: form.research,
            corporate: form.corporate
        }
    });

    // Notifications
    try {
        const facultyUser = await User.findOne({ user_id: faculty_id });

        // 1. Notify Faculty (Officer Graded) that verification or query happened
        await createNotification({
            recipient: faculty_id,
            sender: reportingKey,
            type: status === 'Query Raised' ? 'APAR_SUBMISSION' : 'APAR_REVIEW_REQUEST',
            title: status === 'Query Raised' ? 'Query Raised on APAR' : 'APAR Verified by Reporting Officer',
            message: status === 'Query Raised'
                ? `Reporting Officer has raised a query on your APAR for AY ${ay}.`
                : `Your APAR for AY ${ay} has been verified by the Reporting Officer.`,
            link: '/apar-form'
        });

        // 2. Notify Reviewing Officer only if assessment is successfully forwarded
        // if (status !== 'Query Raised' && facultyUser?.reviewing_officer_id) {
        //     await createNotification({
        //         recipient: facultyUser.reviewing_officer_id,
        //         sender: reportingKey,
        //         type: 'APAR_REVIEW_REQUEST',
        //         title: 'APAR Review Pending',
        //         message: `APAR for ${facultyUser.name || faculty_id} (AY ${ay}) is verified and pending your review.`,
        //         link: '/apar/reviewing'
        //     });
        // }
    } catch (notifErr) {
        console.error("Reporting assessment notification failed:", notifErr);
    }

    return res.status(200).json(new ApiResponse(200, form, "Assessment submitted"));
});

// === Reviewing Officer Actions ===

const getPendingReviewing = asyncHandler(async (req, res) => {
    const { ay } = req.query;
    let reviewingOfficerId = req.user.userId || req.user.faculty_id || req.user.id;
    reviewingOfficerId = await resolveToReadableId(reviewingOfficerId);

    if (!reviewingOfficerId) throw new ApiError(400, 'Reviewing officer identifier not found');

    // Use both readable and Mongo ID to catch any inconsistent data
    const possibleOfficerIds = [reviewingOfficerId];
    if (req.user?.id && req.user.id !== reviewingOfficerId) possibleOfficerIds.push(req.user.id);
    if (req.user?.sub && req.user.sub !== reviewingOfficerId) possibleOfficerIds.push(req.user.sub);

    console.log(`[REVIEWING VIEW] Checking assignments for Officer IDs: ${possibleOfficerIds.join(', ')}`);

    // Direct query to User model
    const assignedUsers = await User.find({ reviewing_officer_id: { $in: possibleOfficerIds } });
    const assignedUserIds = assignedUsers.map(u => u.user_id);
    console.log(`[REVIEWING VIEW] Found ${assignedUsers.length} assigned users: ${assignedUserIds.join(', ')}`);


    if (!assignedUserIds.length) {
        return res.status(200).json(new ApiResponse(200, [], "No assigned officers found for review"));
    }

    const query = {
        faculty_id: { $in: assignedUserIds }
    };

    if (req.query.archive === 'true') {
        query.status = { $ne: 'Draft' };
    } else {
        query.status = {
            $in: [
                'Forwarded by Reporting officer',
                'Accepted by Reviewing officer'
            ]
        };
    }

    if (ay) query.ay = ay;

    console.log(`[REVIEWING VIEW] Querying Forms:`, JSON.stringify(query));
    const forms = await AparForm.find(query).lean();
    console.log(`[REVIEWING VIEW] Forms found: ${forms.length}`);
    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: f.ay,
        name: f.personal?.name,
        designation: f.personal?.designation,
        dept_name: f.personal?.department_id,
        status: f.status,
        date: f.updatedAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "Fetched verified forms for review"));
});

const submitReviewingRemarks = asyncHandler(async (req, res) => {
    // Extract query_comment from request body
    const { faculty_id, ay, remarks, status, query_comment } = req.body;

    const updateData = {
        remarks: remarks,
        status: status || "Accepted by Reviewing officer", // Final status or Query
    };

    if (status && status.includes('Query')) {
        updateData["timeline.reviewing_reviewed_at"] = null;
        // Optionally reset reporting officer time if it goes ALL the way back? 
        // Typically if Reviewing Officer queries, it might go to Reporting Officer.
        // But simply clearing reviewing time effectively 'un-checks' the reviewing step.
    } else {
        updateData["timeline.reviewing_reviewed_at"] = new Date();
    }

    if (query_comment) {
        updateData.query_comment = query_comment;
        updateData.reviewing_query = query_comment;
    }

    const historyEvent = {
        action: status || "Accepted by Reviewing officer",
        by: "Reviewing Officer",
        date: new Date(),
        comment: query_comment || (status === 'Accepted by Reviewing officer' ? 'Accepted by Reviewing Officer' : status)
    };

    const form = await AparForm.findOneAndUpdate(
        { faculty_id, ay },
        {
            $set: updateData,
            $push: { history: historyEvent }
        },
        { new: true }
    );

    if (form) {
        // Sync with Faculty model
        await syncAparToFaculty(faculty_id, {
            ...form.toObject(),
            ay: form.ay,
            formData: {
                personal: form.personal,
                teaching: form.teaching,
                research: form.research,
                corporate: form.corporate
            }
        });
    }

    // Notifications
    try {
        const facultyUser = await User.findOne({ user_id: faculty_id });

        // 1. Notify Faculty (Officer Graded)
        await createNotification({
            recipient: faculty_id,
            sender: req.user?.id,
            type: status?.includes('Query') ? 'APAR_SUBMISSION' : 'APAR_COMPLETED',
            title: status?.includes('Query') ? 'Query Raised by Reviewing Officer' : 'APAR Review Completed',
            message: status?.includes('Query')
                ? `Reviewing Officer has raised a query on your APAR for AY ${ay}.`
                : `Your APAR for AY ${ay} has been successfully reviewed and accepted.`,
            link: '/apar-form'
        });

        // 2. Notify Reporting Officer (since they already verified it)
        // if (facultyUser?.reporting_officer_id) {
        //     await createNotification({
        //         recipient: facultyUser.reporting_officer_id,
        //         sender: req.user?.id,
        //         type: status?.includes('Query') ? 'APAR_REVIEW_REQUEST' : 'APAR_COMPLETED',
        //         title: status?.includes('Query') ? 'Query Raised by Reviewing Officer' : 'APAR Flow Completed',
        //         message: status?.includes('Query')
        //             ? `Reviewing Officer has raised a query on ${facultyUser.name || faculty_id}'s APAR (AY ${ay}), which you previously verified.`
        //             : `The APAR for ${facultyUser.name || faculty_id} (AY ${ay}) has been finalized and accepted by the Reviewing Officer.`,
        //         link: '/apar/reporting'
        //     });
        // }
    } catch (notifErr) {
        console.error("Review remarks notification failed:", notifErr);
    }

    return res.status(200).json(new ApiResponse(200, form, "Review remarks submitted"));
});


const listAllForms = asyncHandler(async (req, res) => {
    const { ay } = req.query;
    if (!ay) throw new ApiError(400, "Academic year (ay) is required");

    const forms = await AparForm.find({ ay }).sort({ updatedAt: -1 });
    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: f.ay,
        name: f.personal?.name,
        designation: f.personal?.designation,
        dept_name: f.personal?.department_id,
        status: f.status,
        date: f.updatedAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "All forms for AY fetched"));
});

const getFacultyInfo = asyncHandler(async (req, res) => {
    let faculty_id = req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);

    if (!faculty_id) throw new ApiError(401, "Not logged in or missing faculty ID");

    let faculty = await findFacultyById(faculty_id);

    // If no faculty record, try fetching from User model (for administrative roles)
    if (!faculty) {
        const user = await User.findOne({ user_id: faculty_id });
        if (user) {
            faculty = {
                faculty_id: user.user_id,
                name: user.name,
                email: user.email,
                designation: user.designation,
                department_id: user.department_id,
                // Add empty defaults for other fields to prevent frontend issues
                qualification: '',
                joining_date: null,
                date_of_birth: null,
                sc_st_status: '',
                phone: '',
                grade: ''
            };
        }
    }

    return res.status(200).json(new ApiResponse(200, faculty || {}, "Faculty info fetched"));
});



/**
 * Prevent duplicates across faculty APARs
 * When Faculty A saves a collaborative entry, sync to Faculty B's APAR
 */
const preventCrossFacultyDuplicates = async (submittingFacultyId, academicYear, researchData) => {
    if (!researchData) return;

    const entriesToCheck = [
        { type: 'journals', data: researchData.journals || [] },
        { type: 'conferences', data: researchData.conferences || [] },
        { type: 'books', data: researchData.books || [] },
        { type: 'patents', data: researchData.patents || [] },
        { type: 'projects', data: researchData.projects || [] }
    ];

    for (const { type, data } of entriesToCheck) {
        for (const entry of data) {
            // Check if entry has multiple faculty members
            const facultyMembers = entry.faculty_members || entry.faculty_involved || [];

            // Should be more than 1 member to be collaborative
            // And ensure it's an array and has items
            if (Array.isArray(facultyMembers) && facultyMembers.length > 1) {
                // Get other faculty IDs (excluding the one who submitted)
                const otherFacultyIds = facultyMembers
                    .map(f => f.faculty_id || f)
                    .filter(id => id && id !== submittingFacultyId);

                // Process each other faculty member
                for (const otherFacultyId of otherFacultyIds) {
                    await handleCrossFacultyEntry(
                        otherFacultyId,
                        academicYear,
                        type, // e.g., 'journals'
                        entry,
                        submittingFacultyId
                    );
                }
            }
        }
    }
};

/**
 * Handle cross-faculty entry
 * Options: 1) Auto-remove duplicate, 2) Mark as synced, 3) Notify
 */
const handleCrossFacultyEntry = async (
    otherFacultyId,
    academicYear,
    entryType, // plural, e.g. 'journals'
    entry,
    submittedBy
) => {
    // Find other faculty's APAR form
    const otherAparForm = await AparForm.findOne({
        faculty_id: otherFacultyId,
        ay: academicYear, // Use 'ay' consistent with schema
        status: 'Draft' // Only modify drafts
    });

    if (!otherAparForm) return; // No form or not in draft, skip

    // Get current research section
    // Check if research object exists, if not create/ignore
    if (!otherAparForm.research) return;

    const researchSection = otherAparForm.research || {};
    const entries = researchSection[entryType] || [];

    if (entries.length === 0) return;

    // Find duplicate entry in other faculty's draft
    const duplicateIndex = entries.findIndex(e =>
        isDuplicateEntry(e, entry, entryType)
    );

    if (duplicateIndex !== -1) {
        // OPTION 1: Auto-remove duplicate
        const removedEntry = entries[duplicateIndex];
        entries.splice(duplicateIndex, 1);

        // Update the specific section
        researchSection[entryType] = entries;

        // Save form with minimize false to ensure empty arrays are saved if needed
        // But better to use findOneAndUpdate to be safe with concurrent edits?
        // Since we loaded generic form, let's use the instance save
        otherAparForm.research = researchSection;
        otherAparForm.markModified('research');
        await otherAparForm.save();

        // Emit Socket event to notify other faculty
        const { emitCrossFacultyUpdate } = await import('../config/socket.js');

        const entryTitle = entry.title || entry.title_of_paper || entry.title_of_book || entry.patent_title || entry.title_research || 'Entry';

        emitCrossFacultyUpdate(otherFacultyId, academicYear, {
            type: entryType.slice(0, -1), // 'journals' -> 'journal'
            action: 'removed_duplicate',
            submittedBy,
            entryTitle: entryTitle
        });

        console.log(`✅ Removed duplicate ${entryType} from ${otherFacultyId}'s draft`);
    }
};

/**
 * Check if two entries are duplicates
 */
const isDuplicateEntry = (entry1, entry2, type) => {
    if (!entry1 || !entry2) return false;

    // Helper to normalize strings: lowercase, trim
    const normalize = (str) => String(str || '').trim().toLowerCase();

    // Helper: compares if ALL keys match
    // But entries structure might differ slightly, so we stick to key fields

    switch (type) {
        case 'journals':
            // Check Title AND Journal Name AND Year
            return normalize(entry1.title || entry1.title_of_paper) === normalize(entry2.title || entry2.title_of_paper) &&
                normalize(entry1.name_of_journal) === normalize(entry2.name_of_journal) &&
                normalize(entry1.year_of_publication) === normalize(entry2.year_of_publication || entry2.year);

        case 'conferences':
            // Check Title AND Conference Name
            return normalize(entry1.title || entry1.title_of_paper) === normalize(entry2.title || entry2.title_of_paper) &&
                normalize(entry1.name_of_conference) === normalize(entry2.name_of_conference);

        case 'books':
            // Check Book Title OR ISBN (if available)
            if (entry1.isbn_number && entry2.isbn_number) {
                return normalize(entry1.isbn_number) === normalize(entry2.isbn_number);
            }
            return normalize(entry1.title_of_book) === normalize(entry2.title_of_book) &&
                normalize(entry1.title_of_chapter) === normalize(entry2.title_of_chapter);

        case 'patents':
            return normalize(entry1.patent_title) === normalize(entry2.patent_title) &&
                normalize(entry1.application_number) === normalize(entry2.application_number);

        case 'projects':
            return normalize(entry1.title_research) === normalize(entry2.title_research) &&
                normalize(entry1.funding_agency_name) === normalize(entry2.funding_agency_name);

        default:
            return false;
    }
};

export {
    getForm,
    getFacultyHistory,
    saveForm,
    submitForm,
    getPendingReporting,
    submitReportingAssessment,
    getPendingReviewing,
    submitReviewingRemarks,
    listAllForms,
    getFacultyInfo,
    saveToMonthlyData,
    syncIqacToAparForm  // Export for auto-sync utility
};
