import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { resolveToReadableId } from "../utils/apar-helpers.js";
import { assertFacultyAccess, buildListFormsQuery } from "../utils/apar-access.js";
import { normalizeRoleValue, ROLES as APAR_ROLES } from "../config/aparRoles.js";
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
import { FacultyProfile } from "../models/facultyProfile.model.js";
import { Teaching } from "../models/teaching.model.js";
import { createNotification, notifyHeads } from "./notification.controller.js";
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or use generic ID generator
import { normalizeQualifications } from '../utils/qualification.util.js';
import { createDocumentPath, createAdditionalDocumentPath, createProfileDepartmentDocumentPath, deleteObject, isAparObjectPath, uploadLocalFile } from '../services/minio.service.js';
import {
    getCompletedTemporaryDocument,
    getTemporaryDocument,
    recordCompletedTemporaryDocument,
    removeTemporaryDocument,
    discardTemporaryDocument
} from '../services/apar-temp-document.service.js';

const generateId = (prefix) => `${prefix}-${Date.now()}-${uuidv4()}`;

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

const escapeRegex = (val) => String(val || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeComparable = (val) => String(val ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeMonthYear = (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const normalized = String(val).trim();
    const monthYearMatch = normalized.match(/^(\d{2})-(\d{4})$/);
    if (monthYearMatch) return normalized;
    const inputMonthMatch = normalized.match(/^(\d{4})-(\d{2})$/);
    if (inputMonthMatch) return `${inputMonthMatch[2]}-${inputMonthMatch[1]}`;
    if (/^\d{4}$/.test(normalized)) return `01-${normalized}`;
    return normalized;
};

const exactText = (val) => {
    const normalized = String(val || '').trim();
    return normalized ? { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } : undefined;
};

const compactQuery = (query) => Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (typeof value === 'object' && !(value instanceof Date) && Object.keys(value).length === 0) return false;
        return true;
    })
);

const buildUpsertFilter = (idField, existingId, generatedId, query) => {
    if (existingId) return { [idField]: existingId };
    const filter = compactQuery(query);
    const hasNaturalKey = Object.keys(filter).some(key => !['type', 'academic_year', 'department_id'].includes(key));
    return hasNaturalKey ? filter : { [idField]: generatedId };
};

const buildUpsertUpdate = (payload, idField, idValue) => {
    const cleanedPayload = stripUndefined(payload);
    const setPayload = { ...cleanedPayload };
    delete setPayload[idField];
    return {
        $set: setPayload,
        $setOnInsert: { [idField]: idValue }
    };
};

const isDuplicateKeyFor = (err, field) => (
    err?.code === 11000
    && (err?.keyPattern?.[field] || err?.keyValue?.[field] || String(err?.message || '').includes(`${field}`))
);

const upsertResearchProject = async (filter, payload, projectId) => {
    const update = buildUpsertUpdate(payload, 'project_id', projectId);
    try {
        return await ResearchProject.findOneAndUpdate(
            filter,
            update,
            { upsert: true, new: true }
        );
    } catch (err) {
        if (!isDuplicateKeyFor(err, 'project_id')) throw err;
        const duplicateProjectId = err?.keyValue?.project_id || projectId;
        if (!duplicateProjectId) throw err;

        return ResearchProject.findOneAndUpdate(
            { project_id: duplicateProjectId },
            update,
            { new: true }
        );
    }
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
                // console.log(`Resolved department "${deptId}" from name "${deptIdInput}"`);
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
    if (obj instanceof Date) return obj; // Preserve Date values
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

const stripUndefined = (obj) => {
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(stripUndefined);
    if (obj !== Object(obj)) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        const sv = stripUndefined(v);
        if (sv !== undefined) out[k] = sv;
    }
    return out;
};

// Helper to compute changes between existing document and update data
const computeChanges = (existingDoc, updateData) => {
    const changes = [];
    const fieldsToIgnore = [
        'metadata', 'faculty_members', 'faculty_involved', 'faculty_associations',
        'faculty_ids', 'student_ids', 'students', 'students_involved'
    ];
    if (!existingDoc) return 'Synced from APAR (created)';
    for (const key of Object.keys(updateData || {})) {
        if (fieldsToIgnore.includes(key)) continue;
        const oldVal = existingDoc[key];
        const newVal = updateData[key];
        const s1 = (oldVal === undefined || oldVal === null) ? '' : String(oldVal);
        const s2 = (newVal === undefined || newVal === null) ? '' : String(newVal);
        if (s1 !== s2) {
            changes.push(`${key}: "${s1}" -> "${s2}"`);
        }
    }
    return changes.length > 0 ? changes.join(', ') : 'Synced from APAR (No field changes detected)';
};

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
    const merge = (sectionKey, iqacList, idField, type, parentObj = research) => {
        if (typeof parentObj[sectionKey] !== 'object' || parentObj[sectionKey] === null) parentObj[sectionKey] = [];
        const oldSection = Array.isArray(parentObj[sectionKey]) ? parentObj[sectionKey] : [];

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
        const wasEmpty = oldSection.length === 0;

        // Preserve existing APAR entries: when section already has data, perform a union merge
        const fallbackKeys = {
            journals: ['title', 'title_of_paper', 'name_of_journal'],
            conferences: ['title', 'title_of_paper', 'name_of_conference'],
            books: ['title_of_book', 'title'],
            projects: ['title_research', 'title', 'name_of_project'],
            consultancy: ['name_of_project', 'title'],
            patents: ['patent_title', 'title'],
            awards: ['name_of_award', 'title'],
            fdps: ['program_title', 'title'],
            e_content: ['name_of_module', 'title'],
            collaborations: ['title_of_activity', 'title'],
            faculty_visits: ['title'],
            student_centric_methods: ['description']
        };

        const idKeyFor = (item) => {
            const idVal = item && item[idField];
            const id = (idVal === 0 ? '0' : (idVal || '')).toString().trim().toLowerCase();
            return id ? `id:${id}` : '';
        };

        const naturalKeyFor = (item) => {
            const keys = fallbackKeys[sectionKey] || ['title'];
            const values = keys
                .map((k) => item && item[k])
                .map((v) => (v === 0 ? '0' : (v || '')).toString().trim().toLowerCase())
                .filter(Boolean);
            return values.length ? `n:${values.join('|')}` : '';
        };

        if (wasEmpty) {
            if (newSection.length > 0) modified = true;
            parentObj[sectionKey] = newSection;
            return;
        }

        const combined = [];
        const byId = new Map();
        const byNatural = new Map();

        const indexItem = (item, index) => {
            const idKey = idKeyFor(item);
            const naturalKey = naturalKeyFor(item);
            if (idKey) byId.set(idKey, index);
            if (naturalKey) byNatural.set(naturalKey, index);
        };

        const newSectionIds = new Set(newSection.map(idKeyFor).filter(Boolean));

        for (const it of oldSection) {
            const idKey = idKeyFor(it);
            if (idKey && !newSectionIds.has(idKey)) {
                modified = true;
                continue;
            }
            combined.push(it);
            indexItem(it, combined.length - 1);
        }

        for (const it of newSection) {
            const idKey = idKeyFor(it);
            const naturalKey = naturalKeyFor(it);
            const existingIndex = (idKey && byId.has(idKey))
                ? byId.get(idKey)
                : (naturalKey && byNatural.has(naturalKey))
                    ? byNatural.get(naturalKey)
                    : -1;

            if (existingIndex === -1) {
                combined.push(it);
                indexItem(it, combined.length - 1);
                modified = true;
                continue;
            }

            const existing = combined[existingIndex] || {};
            const merged = { ...it, ...existing, [idField]: existing[idField] || it[idField] };
            if (!existing[idField] && it[idField]) modified = true;
            combined[existingIndex] = merged;
            indexItem(merged, existingIndex);
        }

        if (combined.length !== oldSection.length) {
            modified = true;
        }
        parentObj[sectionKey] = combined;
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

        // console.log(`[PATENT DEBUG] Found ${patents.length} patents:`, JSON.stringify(patents, null, 2));

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

        // 14. Student Centric Methods (Teaching)
        const teachingMethods = await Teaching.find({ faculty_id: idQuery, academic_year: { $in: ayVariants } }).lean();
        const teachingMapped = teachingMethods.map(t => ({
            ...t,
            description: t.details_of_methods,
            method_id: t.method_id
        }));
        if (!form.teaching) form.teaching = {};
        merge('student_centric_methods', teachingMapped, 'method_id', 'default', form.teaching);

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
    await assertFacultyAccess(req.user, faculty_id);

    let ay = req.query.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);

    if (!faculty_id) {
        throw new ApiError(400, "Faculty ID is required");
    }

    let form;
    if (ay) {
        // Fetch user/faculty details for auto-population (needed for creation)
        const legacyFaculty = await Faculty.findOne({ faculty_id });
        const userProfile = await User.findOne({ user_id: faculty_id });
        const actualProfile = await FacultyProfile.findOne({ faculty_id: new RegExp(`^${faculty_id}$`, 'i') }).lean();
        
        let facultyProfile = legacyFaculty ? legacyFaculty.toObject() : {};
        if (actualProfile) {
            if (actualProfile.basic_info?.full_name) facultyProfile.name = actualProfile.basic_info.full_name;
            if (actualProfile.contact_info?.email_address) facultyProfile.email = actualProfile.contact_info.email_address;
            if (actualProfile.professional_info?.designation) facultyProfile.designation = actualProfile.professional_info.designation;
            if (actualProfile.basic_info?.date_of_birth) facultyProfile.date_of_birth = actualProfile.basic_info.date_of_birth;
            if (actualProfile.contact_info?.mobile_number) facultyProfile.phone = actualProfile.contact_info.mobile_number;
            if (actualProfile.professional_info?.date_of_joining) facultyProfile.joining_date = actualProfile.professional_info.date_of_joining;
        }

        // Check if form exists first (User request)
        form = await AparForm.findOne({ faculty_id, ay });

        // IF form doesn't exist, create it + sync
        if (!form) {
            // console.log(`[APAR] No form found for Faculty=${faculty_id}, AY=${ay}. Creating new draft.`);

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
                    ...normalizeQualifications(facultyProfile || {}),
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

        // Always sync IQAC data into the in-memory form so response reflects latest entries (e.g., patents)
        const modified = await syncIqacToAparForm(form, faculty_id, ay);

        // Only persist changes for editable (Draft-like) statuses
        if (form.status === 'Draft' || form.status === 'check_submit_status' || !form.status) {
            // Sync personal info to ensure it reflects latest profile changes
            if (facultyProfile) {
                if (!form.personal) form.personal = {};
                let pChanged = false;

                const updateIfChanged = (key, val) => {
                    if (val !== undefined && String(form.personal[key]) !== String(val)) {
                        form.personal[key] = val;
                        pChanged = true;
                    }
                };

                updateIfChanged('name', facultyProfile.name);
                updateIfChanged('email', facultyProfile.email);
                updateIfChanged('designation', facultyProfile.designation);
                updateIfChanged('date_of_birth', facultyProfile.date_of_birth);
                updateIfChanged('phone', facultyProfile.phone);
                updateIfChanged('joining_date', facultyProfile.joining_date);

                const normalizedQuals = normalizeQualifications({
                    ...(form.personal || {}),
                    ...(facultyProfile || {}),
                });
                ['qualification_undergraduate', 'qualification_postgraduate', 'qualification_phd'].forEach((field) => {
                    updateIfChanged(field, normalizedQuals[field]);
                });

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

    let formObj = form ? form.toObject() : {};

    // Inject educational qualifications from profile if viewing
    if (form) {
        const facProfile = await FacultyProfile.findOne({ faculty_id: new RegExp(`^${faculty_id}$`, 'i') }).lean();
        if (facProfile && facProfile.educational_qualifications) {
            formObj.profileQualifications = facProfile.educational_qualifications;
        }
    }

    return res.status(200).json(
        new ApiResponse(200, formObj, "Form fetched successfully")
    );
});

const getFacultyHistory = asyncHandler(async (req, res) => {
    let faculty_id = req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");

    const forms = await AparForm.find({ faculty_id }).sort({ ay: -1 }).lean();

    // Collect unique officer IDs
    const officerIds = new Set();
    forms.forEach(f => {
        if (f.reporting_officer_id) officerIds.add(f.reporting_officer_id);
        if (f.reviewing_officer_id) officerIds.add(f.reviewing_officer_id);
    });

    // Fetch officer names
    const officers = await User.find({ user_id: { $in: Array.from(officerIds) } }, 'user_id name').lean();
    const officerNameMap = {};
    officers.forEach(o => {
        officerNameMap[o.user_id] = o.name;
    });

    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: normalizeAY(f.ay), // Ensure output is normalized
        status: f.status,
        timeline: f.timeline,
        history: f.history, // Include history array
        query_comment: f.query_comment || (f.remarks && f.remarks.query_comment),
        reporting_query: f.reporting_query,
        reviewing_query: f.reviewing_query,
        reporting_officer_id: f.reporting_officer_id,
        reviewing_officer_id: f.reviewing_officer_id,
        reporting_officer_name: officerNameMap[f.reporting_officer_id] || null,
        reviewing_officer_name: officerNameMap[f.reviewing_officer_id] || null,
        updatedAt: f.updatedAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "Faculty APAR history fetched"));
});

const getFacultyHistoryByDean = asyncHandler(async (req, res) => {
    const role = normalizeRoleValue(req.user?.role);
    if (role !== APAR_ROLES.DEAN) {
        throw new ApiError(403, "Only Dean accounts can view faculty APAR history");
    }

    const faculty_id = req.query.faculty_id;
    if (!faculty_id) {
        throw new ApiError(400, "Faculty ID is required");
    }

    const ay = req.query.ay ? normalizeAY(req.query.ay) : undefined;

    const query = { faculty_id };
    if (ay) query.ay = ay;

    const forms = await AparForm.find(query).sort({ ay: -1 }).lean();
    const list = forms.map(f => ({
        faculty_id: f.faculty_id,
        ay: normalizeAY(f.ay),
        status: f.status,
        timeline: f.timeline,
        history: f.history,
        query_comment: f.query_comment || (f.remarks && f.remarks.query_comment),
        reporting_query: f.reporting_query,
        reviewing_query: f.reviewing_query,
        updatedAt: f.updatedAt,
        createdAt: f.createdAt
    }));

    return res.status(200).json(new ApiResponse(200, list, "Faculty APAR history fetched by dean"));
});

const DELETE_ALLOWED_STATUSES = new Set([
    'Draft',
    'Query Raised',
    'Query Raised by Reporting officer',
    'Query Raised by Reviewing officer',
    'not_filled'
]);

const deleteForm = asyncHandler(async (req, res) => {
    let faculty_id = req.query.faculty_id || req.body?.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

    let ay = req.query.ay || req.body?.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");
    if (!ay) throw new ApiError(400, "Academic year (ay) is required");

    const form = await AparForm.findOne({ faculty_id, ay });
    if (!form) {
        throw new ApiError(404, "APAR form not found");
    }

    const status = form.status || 'Draft';
    if (!DELETE_ALLOWED_STATUSES.has(status)) {
        throw new ApiError(400, "Only draft or query-returned APAR forms can be deleted");
    }

    await AparForm.deleteOne({ _id: form._id });
    await Promise.allSettled([...collectAparObjectPaths(form.research)].map(objectPath => deleteObject(objectPath)));

    return res.status(200).json(new ApiResponse(200, { faculty_id, ay }, "APAR form deleted permanently"));
});

const normalizeResearchMonthYears = (research = {}) => {
    const normalizedResearch = { ...research };
    const normalizeList = (sectionKey, fields) => {
        if (!Array.isArray(normalizedResearch[sectionKey])) return;
        normalizedResearch[sectionKey] = normalizedResearch[sectionKey].map(item => {
            const nextItem = { ...item };
            fields.forEach(field => {
                if (nextItem[field]) nextItem[field] = normalizeMonthYear(nextItem[field]);
            });
            return nextItem;
        });
    };

    normalizeList('journals', ['year_of_publication']);
    normalizeList('conferences', ['year_of_publication']);
    normalizeList('books', ['year']);
    normalizeList('projects', ['year_of_sanction']);
    normalizeList('consultancy', ['year_of_consultancy']);
    normalizeList('awards', ['year']);
    normalizeList('collaborations', ['year']);
    normalizeList('mous', ['year_of_signing']);
    normalizeList('phd_supervision', ['registration_year']);

    return normalizedResearch;
};

const getResearchDuplicateKey = (sectionKey, item = {}) => {
    const join = (...parts) => parts.map(part => normalizeComparable(part)).filter(Boolean).join('|');
    const monthYear = (value) => normalizeComparable(normalizeMonthYear(value));

    switch (sectionKey) {
        case 'journals':
            return join(item.paper_id) || join(item.title || item.title_of_paper, item.name_of_journal, monthYear(item.year_of_publication), item.volume, item.issue);
        case 'conferences':
            return join(item.paper_id) || join(item.title || item.title_of_paper, item.name_of_conference, monthYear(item.year_of_publication));
        case 'books':
            return join(item.publication_id) || join(item.isbn_number) || join(item.title_of_book, item.title_of_chapter, monthYear(item.year));
        case 'projects':
            return join(item.project_id || item.funding_id) || join(item.sanction_number) || join(item.title_research || item.title, item.funding_agency_name, monthYear(item.year_of_sanction));
        case 'consultancy':
            return join(item.project_id || item.consultancy_id) || join(item.name_of_project || item.title, item.agency_name, monthYear(item.year_of_consultancy), item.start_date);
        case 'patents':
            return join(item.patent_id) || join(item.application_number) || join(item.patent_title, item.date_of_filing);
        case 'awards':
            return join(item.award_id) || join(item.name_of_award, item.awarding_agency, monthYear(item.year));
        case 'e_content':
            return join(item.econtent_id) || join(item.name_of_module, item.course_id, item.academic_year);
        case 'faculty_visits':
            return join(item.visit_id) || join(item.organisation_name, item.title, item.start_date);
        case 'fdps':
        case 'workshops':
            return join(item.program_id || item.activity_id) || join(item.program_title, item.organising_body, item.start_date);
        case 'collaborations':
            return join(item.collaboration_id || item.activity_id) || join(item.title_of_activity || item.title, item.name_of_collaborative_agency, monthYear(item.year));
        case 'mous':
            return join(item.collaboration_id || item.mou_id) || join(item.organisation_name, item.title, monthYear(item.year_of_signing));
        case 'phd_supervision':
            return join(item.defence_id) || join(item.student_id || item.enrollment_no, item.thesis_title, monthYear(item.registration_year));
        default:
            return '';
    }
};

const getResearchDuplicateLabel = (sectionKey, item = {}) => (
    item.title ||
    item.title_of_paper ||
    item.title_of_book ||
    item.title_of_chapter ||
    item.title_research ||
    item.name_of_project ||
    item.patent_title ||
    item.name_of_award ||
    item.name_of_module ||
    item.title_of_activity ||
    item.program_title ||
    item.thesis_title ||
    sectionKey
);

const checkDraftDuplicates = (data) => {
    const research = data.research || {};
    const sectionKeys = [
        'journals',
        'conferences',
        'books',
        'projects',
        'consultancy',
        'patents',
        'awards',
        'e_content',
        'faculty_visits',
        'fdps',
        'workshops',
        'collaborations',
        'mous',
        'phd_supervision'
    ];

    for (const sectionKey of sectionKeys) {
        const list = research[sectionKey];
        if (!Array.isArray(list) || list.length <= 1) continue;

        const seen = new Set();
        for (const item of list) {
            const key = getResearchDuplicateKey(sectionKey, item);
            if (!key) continue;
            if (seen.has(key)) {
                throw new ApiError(400, `Duplicate entry found in ${sectionKey}: "${getResearchDuplicateLabel(sectionKey, item)}". Please remove duplicates.`);
            }
            seen.add(key);
        }
    }
};

const documentFieldNames = new Set([
    'link', 'link_to_paper', 'link_to_publication', 'evidence_link',
    'certificate_link', 'link_to_patent', 'immovable_property_return', 'health_checkup_file'
]);

const collectAparObjectPaths = (value, result = new Set()) => {
    if (typeof value === 'string') {
        if (isAparObjectPath(value)) result.add(value);
        return result;
    }
    // Mongoose subdocuments retain circular parent references. Convert them to
    // plain data before recursively scanning for stored document paths.
    if (value && typeof value === 'object' && typeof value.toObject === 'function') {
        return collectAparObjectPaths(value.toObject(), result);
    }
    if (Array.isArray(value)) value.forEach(item => collectAparObjectPaths(item, result));
    else if (value && typeof value === 'object' && !value._bsontype && !(value instanceof Date)) {
        Object.values(value).forEach(item => collectAparObjectPaths(item, result));
    }
    return result;
};

const resolveAparDocuments = async (formData, { ownerId, facultyName, academicYear }) => {
    const uploadedPaths = [];
    const temporaryIds = [];
    const resolved = structuredClone(formData || {});

    const visit = async (value, key = '') => {
        if (Array.isArray(value)) {
            for (let index = 0; index < value.length; index += 1) value[index] = await visit(value[index]);
            return value;
        }
        if (!value || typeof value !== 'object') return value;

        if (documentFieldNames.has(key) && value.tempId) {
            const completedPath = getCompletedTemporaryDocument(value.tempId, ownerId);
            if (completedPath) return completedPath;

            const temporary = getTemporaryDocument(value.tempId, ownerId);
            if (!temporary) throw new ApiError(400, 'The selected PDF has expired. Please select it again.');

            const isAdditional = key === 'immovable_property_return' || key === 'health_checkup_file';
            
            let objectPath;
            if (isAdditional) {
                objectPath = createAdditionalDocumentPath(facultyName, academicYear, value.originalName);
            } else {
                objectPath = createDocumentPath(facultyName, academicYear);
            }
            temporaryIds.push(value.tempId);
            await uploadLocalFile({
                filePath: temporary.filePath,
                objectPath,
                contentType: value.mimeType || 'application/pdf'
            });
            uploadedPaths.push(objectPath);
            return objectPath;
        }

        for (const [childKey, childValue] of Object.entries(value)) value[childKey] = await visit(childValue, childKey);
        return value;
    };

    try {
        return { formData: await visit(resolved), uploadedPaths, temporaryIds };
    } catch (error) {
        await Promise.allSettled(uploadedPaths.map(objectPath => deleteObject(objectPath)));
        await Promise.allSettled(temporaryIds.map(tempId => discardTemporaryDocument(tempId)));
        throw error;
    }
};

const saveForm = asyncHandler(async (req, res) => {
    let ay = req.body.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);
    let formData = req.body.formData;
    let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

    if (!faculty_id) {
        throw new ApiError(400, "Faculty ID is required. Please sign in again.");
    }
    if (!ay) {
        throw new ApiError(400, "Academic Year (Ay) is required. Please ensure it is selected or filled in Part I.");
    }

    // Clean formData to replace "" with undefined for Dates/Numbers to avoid CastError
    if (formData) {
        // console.log('[SAVE FORM DEBUG] Received Research Keys:', Object.keys(formData.research || {}));
        if (formData.research?.journals) {
            // console.log('[SAVE FORM DEBUG] Raw Journals:', JSON.stringify(formData.research.journals, null, 2));
        }

        formData = cleanEmptyStrings(formData);
        if (formData.research) {
            formData.research = normalizeResearchMonthYears(formData.research);
        }

        if (formData.research?.journals) {
            // console.log('[SAVE FORM DEBUG] Cleaned Journals:', JSON.stringify(formData.research.journals, null, 2));
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

    // NEW: Propagate faculty deletions to IQAC central database
    if (existing && existing.research && formData && formData.research) {
        const deletedIds = {
            journals: [], conferences: [], books: [], projects: [], consultancy: [], patents: [], awards: [], fdps: [], e_content: [], collaborations: [], faculty_visits: [], mous: [], phd_supervision: []
        };
        const idFields = {
            journals: 'paper_id', conferences: 'paper_id', books: 'publication_id', projects: 'project_id', consultancy: 'consultancy_id', patents: 'patent_id', awards: 'award_id', fdps: 'activity_id', e_content: 'econtent_id', collaborations: 'activity_id', faculty_visits: 'visit_id', mous: 'mou_id', phd_supervision: 'defence_id'
        };

        for (const sectionKey of Object.keys(idFields)) {
            const idField = idFields[sectionKey];
            const oldArray = existing.research[sectionKey] || [];
            const newArray = formData.research[sectionKey] || [];
            
            const oldIds = new Set(oldArray.map(item => item[idField]).filter(Boolean));
            const newIds = new Set(newArray.map(item => item[idField]).filter(Boolean));
            
            for (const oldId of oldIds) {
                if (!newIds.has(oldId)) {
                    deletedIds[sectionKey].push(oldId);
                }
            }
        }

        try {
            if (deletedIds.journals.length > 0) await Publication.deleteMany({ type: 'journal', paper_id: { $in: deletedIds.journals } });
            if (deletedIds.conferences.length > 0) await Publication.deleteMany({ type: 'conference', paper_id: { $in: deletedIds.conferences } });
            if (deletedIds.books.length > 0) await Publication.deleteMany({ type: 'book', publication_id: { $in: deletedIds.books } });
            if (deletedIds.projects.length > 0) await ResearchProject.deleteMany({ type: 'funding', project_id: { $in: deletedIds.projects } });
            if (deletedIds.consultancy.length > 0) await ResearchProject.deleteMany({ type: 'consultancy', project_id: { $in: deletedIds.consultancy } });
            if (deletedIds.patents.length > 0) await Patent.deleteMany({ patent_id: { $in: deletedIds.patents } });
            if (deletedIds.awards.length > 0) await FacultyActivity.deleteMany({ type: 'award', activity_id: { $in: deletedIds.awards } });
            if (deletedIds.fdps.length > 0) await FacultyActivity.deleteMany({ type: 'fdp', activity_id: { $in: deletedIds.fdps } });
            if (deletedIds.e_content.length > 0) await FacultyActivity.deleteMany({ type: 'econtent', activity_id: { $in: deletedIds.e_content } });
            if (deletedIds.collaborations.length > 0) await Collaboration.deleteMany({ type: 'activity', collaboration_id: { $in: deletedIds.collaborations } });
            if (deletedIds.faculty_visits.length > 0) await FacultyActivity.deleteMany({ type: 'visit', activity_id: { $in: deletedIds.faculty_visits } });
            if (deletedIds.mous.length > 0) await Collaboration.deleteMany({ type: 'mou', collaboration_id: { $in: deletedIds.mous } });
            if (deletedIds.phd_supervision.length > 0) await PhdDefence.deleteMany({ defence_id: { $in: deletedIds.phd_supervision } });
        } catch (delError) {
            console.error("Error deleting propagated IQAC records:", delError);
        }
    }

    const faculty = await Faculty.findOne({ faculty_id }).lean();
    const facultyName = faculty?.name || formData?.personal?.name || faculty_id;
    let uploadedPaths = [];
    let temporaryIds = [];
    let form;
    try {
        const documents = await resolveAparDocuments(formData, {
            ownerId: req.user.id,
            facultyName,
            academicYear: ay
        });
        formData = documents.formData;
        uploadedPaths = documents.uploadedPaths;
        temporaryIds = documents.temporaryIds;

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
        await Promise.allSettled(uploadedPaths.map(objectPath => deleteObject(objectPath)));
        await Promise.allSettled(temporaryIds.map(tempId => discardTemporaryDocument(tempId)));
        console.error("Save Draft DB Error:", dbError);
        throw new ApiError(400, `Failed to save draft: ${dbError.message}`);
    }

    for (const tempId of temporaryIds) {
        // The upload path is retained in a receipt so repeated auto-saves remain idempotent.
        const matchingPath = uploadedPaths.shift();
        if (matchingPath) recordCompletedTemporaryDocument(tempId, req.user.id, matchingPath);
        await removeTemporaryDocument(tempId);
    }

    const oldPaths = collectAparObjectPaths(existing?.research);
    const currentPaths = collectAparObjectPaths(form.research);
    const stalePaths = [...oldPaths].filter(objectPath => !currentPaths.has(objectPath));
    // Row/file actions delete their PDFs explicitly. Keep the normal draft save
    // successful if an old legacy object is already missing from storage.
    const cleanupResults = await Promise.allSettled(stalePaths.map(objectPath => deleteObject(objectPath)));
    cleanupResults.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`[APAR DOCUMENT CLEANUP] Could not delete ${stalePaths[index]}:`, result.reason);
        }
    });

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
    let ay = req.body.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);
    let formData = req.body.formData;
    let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");
    if (!ay) throw new ApiError(400, "Academic Year (Ay) is required");
    if (formData) {
        formData = cleanEmptyStrings(formData);
        if (formData.research) {
            formData.research = normalizeResearchMonthYears(formData.research);
            checkDraftDuplicates({ research: formData.research });
        }
    }

    const existingForCheck = await AparForm.findOne({ faculty_id, ay }).lean();
    if (!existingForCheck || !existingForCheck.monthly_saved_at) {
        throw new ApiError(400, "Please use 'Save as Monthly' in Part III before submitting the APAR form.");
    }

    const user = await User.findOne({ user_id: faculty_id });

    const setObj = {
        personal: formData.personal,
        teaching: formData.teaching,
        research: formData.research,
        corporate: formData.corporate,
        status: "Submitted",
        "timeline.submitted_at": new Date()
    };

    let reportingOfficerId = null;
    let reviewingOfficerId = null;

    if (user) {
        // 1. Direct Assignment for Reporting Officer
        if (user.reporting_officer_id) {
            reportingOfficerId = user.reporting_officer_id;
        } else if (user.department_id) {
            // 2. Same Department Search
            const reportingOfficer = await User.findOne({ department_id: user.department_id, apar_role: 'Reporting Officer' });
            if (reportingOfficer) {
                reportingOfficerId = reportingOfficer.user_id;
            } else {
                // 3. Global Search
                const globalReportingOfficer = await User.findOne({ apar_role: 'Reporting Officer' });
                if (globalReportingOfficer) {
                    reportingOfficerId = globalReportingOfficer.user_id;
                }
            }
        }

        // 1. Direct Assignment for Reviewing Officer
        if (user.reviewing_officer_id) {
            reviewingOfficerId = user.reviewing_officer_id;
        } else if (user.department_id) {
            // 2. Same Department Search
            const reviewingOfficer = await User.findOne({ department_id: user.department_id, apar_role: 'Reviewing Officer' });
            if (reviewingOfficer) {
                reviewingOfficerId = reviewingOfficer.user_id;
            } else {
                // 3. Global Search
                let globalReviewingOfficer = await User.findOne({ apar_role: 'Reviewing Officer' });
                if (!globalReviewingOfficer) {
                    globalReviewingOfficer = await User.findOne({ apar_role: 'Dean' });
                }
                if (globalReviewingOfficer) {
                    reviewingOfficerId = globalReviewingOfficer.user_id;
                }
            }
        }
    }

    if (!reportingOfficerId || !reviewingOfficerId) {
        throw new ApiError(400, "Contact office to add receiving and reporting officer");
    }

    setObj.reporting_officer_id = reportingOfficerId;
    setObj.reviewing_officer_id = reviewingOfficerId;

    const form = await AparForm.findOneAndUpdate(
        { faculty_id, ay },
        {
            $set: setObj,
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

const saveToMonthly = asyncHandler(async (req, res) => {
    let ay = req.body.ay || req.user?.academicYear;
    if (ay) ay = normalizeAY(ay);
    let faculty_id = req.body.faculty_id || req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

    if (!faculty_id) throw new ApiError(400, "Faculty ID is required");
    if (!ay) throw new ApiError(400, "Academic Year (Ay) is required");

    let formData = cleanEmptyStrings(req.body.formData || {});
    let research = normalizeResearchMonthYears(formData.research || {});
    checkDraftDuplicates({ research });
    formData = { ...formData, research };

    const faculty = await Faculty.findOne({ faculty_id }).lean();
    const facultyName = faculty?.name || formData?.personal?.name || faculty_id;
    let uploadedPaths = [];
    let temporaryIds = [];

    try {
        const documents = await resolveAparDocuments(formData, {
            ownerId: req.user.id,
            facultyName,
            academicYear: ay
        });
        formData = documents.formData;
        uploadedPaths = documents.uploadedPaths;
        temporaryIds = documents.temporaryIds;
        research = formData.research || {};
    } catch (dbError) {
        await Promise.allSettled(uploadedPaths.map(objectPath => deleteObject(objectPath)));
        await Promise.allSettled(temporaryIds.map(tempId => discardTemporaryDocument(tempId)));
        throw new ApiError(400, `Failed to resolve documents: ${dbError.message}`);
    }

    for (const tempId of temporaryIds) {
        const matchingPath = uploadedPaths.shift();
        if (matchingPath) recordCompletedTemporaryDocument(tempId, req.user.id, matchingPath);
        await removeTemporaryDocument(tempId);
    }

    const deptIdFallback = formData?.personal?.department_id || req.user?.departmentId || undefined;

    const toBool = (v) => (typeof v === 'boolean') ? v : (String(v || '').toLowerCase() === 'yes' || String(v || '').toLowerCase() === 'true');
    const extractLink = (val) => typeof val === 'string' ? val : null;
    const upserts = [];
    const trackUpsert = (item, idField, promise, itemField = idField) => {
        upserts.push(promise.then(doc => {
            if (doc?.[idField]) {
                const itemFields = Array.isArray(itemField) ? itemField : [itemField];
                itemFields.forEach((field) => {
                    item[field] = doc[field] || doc[idField];
                });
            }
            return doc;
        }));
    };

    const ensureFaculty = (arr, fId, role = undefined) => {
        let list = [];
        if (Array.isArray(arr)) {
            list = arr.map(f => {
                let id = f.faculty_id || f.faculty || f.emp_code || f;
                if (typeof id === 'object') id = id.faculty_id || id.id || id.emp_code;
                return { 
                    faculty_id: id, 
                    role: f.role || role,
                    author_type: f.author_type,
                    name: f.name,
                    emp_code: f.emp_code
                };
            });
        }
        if (!list.some(f => String(f.faculty_id) === String(fId) || String(f.emp_code) === String(fId))) {
            list.push({ faculty_id: fId, role });
        }
        return list;
    };

    for (const item of (research.journals || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const publication_id = item.publication_id || generateId('PUB');
        const payload = stripUndefined(cleanEmptyStrings({
            publication_id,
            department_id,
            type: 'journal',
            paper_id: item.paper_id || item.publication_id || publication_id,
            title: item.title || item.title_of_paper,
            name_of_journal: item.name_of_journal,
            author_names: item.author_names,
            issn: item.issn,
            volume: item.volume,
            issue: item.issue,
            page_numbers: item.page_numbers,
            year_of_publication: normalizeMonthYear(item.year_of_publication),
            doi: item.doi,
            indexing: item.indexing,
            impact_factor: item.impact_factor,
            citation_count: parseNumber(item.citation_count),
            is_ugc_care_listed: toBool(item.is_ugc_care_listed),
            link: extractLink(item.link),
            link_to_paper: extractLink(item.link_to_paper),
            academic_year: item.academic_year || ay,
            faculty_members: ensureFaculty(item.faculty_members, faculty_id),
            students: Array.isArray(item.students) ? item.students.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no })) : [],
            external_authors: Array.isArray(item.external_authors) ? item.external_authors : [],
            external_contributors: Array.isArray(item.external_contributors) ? item.external_contributors : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        }));
        const filter = buildUpsertFilter('publication_id', item.publication_id, publication_id, item.paper_id
            ? { type: 'journal', paper_id: item.paper_id }
            : {
                type: 'journal',
                title: exactText(item.title || item.title_of_paper),
                name_of_journal: exactText(item.name_of_journal),
                year_of_publication: normalizeMonthYear(item.year_of_publication),
                academic_year: item.academic_year || ay
            });
        trackUpsert(item, 'publication_id', Publication.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'publication_id', publication_id),
            { upsert: true, new: true }
        ), ['publication_id', 'paper_id']);
    }

    for (const item of (research.conferences || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const publication_id = item.publication_id || generateId('PUB');
        const payload = cleanEmptyStrings({
            publication_id,
            department_id,
            type: 'conference',
            paper_id: item.paper_id || item.publication_id || publication_id,
            title: item.title || item.title_of_paper,
            name_of_conference: item.name_of_conference,
            conference_level: item.conference_level,
            organizer: item.organizer,
            venue: item.venue,
            publisher: item.publisher,
            other_publisher: item.other_publisher,
            isbn: item.isbn,
            issn: item.issn,
            volume: item.volume,
            award_received: item.award_received,
            paper_status: item.paper_status,
            year_of_publication: normalizeMonthYear(item.year_of_publication),
            doi: item.doi,
            indexing: item.indexing,
            link: extractLink(item.link),
            link_to_paper: extractLink(item.link_to_paper),
            academic_year: item.academic_year || ay,
            faculty_members: ensureFaculty(item.faculty_members, faculty_id),
            students: Array.isArray(item.students) ? item.students.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no })) : [],
            external_contributors: Array.isArray(item.external_contributors) ? item.external_contributors : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('publication_id', item.publication_id, publication_id, item.paper_id
            ? { type: 'conference', paper_id: item.paper_id }
            : {
                type: 'conference',
                title: exactText(item.title || item.title_of_paper),
                name_of_conference: exactText(item.name_of_conference),
                year_of_publication: normalizeMonthYear(item.year_of_publication),
                academic_year: item.academic_year || ay
            });
        trackUpsert(item, 'publication_id', Publication.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'publication_id', publication_id),
            { upsert: true, new: true }
        ), ['publication_id', 'paper_id']);
    }

    for (const item of (research.books || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const publication_id = item.publication_id || generateId('PUB');
        const payload = cleanEmptyStrings({
            publication_id,
            department_id,
            type: 'book',
            publication_type: item.publication_type,
            title: item.title_of_book || item.title,
            title_of_book: item.title_of_book,
            title_of_chapter: item.title_of_chapter,
            role: item.role,
            year: normalizeMonthYear(item.year),
            isbn_number: item.isbn_number,
            name_of_publisher: item.name_of_publisher,
            publisher_type: item.publisher_type,
            same_institute_affiliation: toBool(item.same_institute_affiliation),
            link: extractLink(item.link),
            link_to_publication: extractLink(item.link_to_publication),
            doi: item.doi,
            indexing: item.indexing,
            academic_year: item.academic_year || ay,
            faculty_members: ensureFaculty(item.faculty_members || item.faculty_ids, faculty_id),
            students: Array.isArray(item.students) ? item.students.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no })) : (Array.isArray(item.student_ids) ? item.student_ids.map(sid => ({ student_id: sid })) : []),
            external_contributors: Array.isArray(item.external_contributors) ? item.external_contributors : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('publication_id', item.publication_id, publication_id, item.isbn_number
            ? { type: 'book', isbn_number: item.isbn_number }
            : {
                type: 'book',
                title_of_book: exactText(item.title_of_book),
                title_of_chapter: exactText(item.title_of_chapter),
                year: normalizeMonthYear(item.year),
                academic_year: item.academic_year || ay
            });
        trackUpsert(item, 'publication_id', Publication.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'publication_id', publication_id),
            { upsert: true, new: true }
        ));
    }

    for (const item of (research.projects || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const existingProjectId = item.project_id || item.funding_id;
        const project_id = existingProjectId || generateId('RES');
        const funding_id = item.funding_id || item.project_id || project_id;
        const payload = cleanEmptyStrings({
            project_id,
            funding_id,
            department_id,
            type: 'funding',
            title: item.title || item.title_research,
            title_research: item.title_research,
            role: item.role,
            type_of_project: item.type_of_project,
            funding_agency_name: item.funding_agency_name,
            agency_name: item.funding_agency_name,
            chair_holder: item.chair_holder,
            funding_type: item.funding_type,
            sanction_number: item.sanction_number,
            year_of_sanction: normalizeMonthYear(item.year_of_sanction),
            amount: parseNumber(item.amount),
            start_date: parseDate(item.start_date),
            end_date: parseDate(item.end_date),
            status: item.status,
            outcome: item.outcome,
            remarks: item.remarks,
            link: extractLink(item.link),
            academic_year: item.academic_year || ay,
            faculty_involved: ensureFaculty(item.faculty_involved, faculty_id),
            students_involved: Array.isArray(item.students_involved) ? item.students_involved.map(s => ({ student_id: s.student_id || s, role: s.role })) : [],
            external_collaborators: Array.isArray(item.external_collaborators) ? item.external_collaborators : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = existingProjectId
            ? { type: 'funding', $or: [{ project_id: existingProjectId }, { funding_id: existingProjectId }] }
            : item.sanction_number
                ? { type: 'funding', sanction_number: item.sanction_number }
                : {
                    type: 'funding',
                    title: exactText(item.title || item.title_research),
                    funding_agency_name: exactText(item.funding_agency_name),
                    year_of_sanction: normalizeMonthYear(item.year_of_sanction),
                    academic_year: item.academic_year || ay
                };
        trackUpsert(item, 'project_id', upsertResearchProject(filter, payload, project_id), ['project_id', 'funding_id']);
    }

    for (const item of (research.consultancy || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const project_id = item.project_id || item.consultancy_id || generateId('RES');
        const payload = cleanEmptyStrings({
            project_id,
            department_id,
            type: 'consultancy',
            title: item.title || item.name_of_project,
            name_of_project: item.name_of_project,
            agency_name: item.agency_name,
            type_of_agency: item.type_of_agency,
            consultancy_type: item.consultancy_type,
            grant_amount: parseNumber(item.grant_amount),
            revenue_generated: parseNumber(item.revenue_generated),
            start_date: parseDate(item.start_date) || parseDate(item.duration_start_date),
            end_date: parseDate(item.end_date),
            consultancy_id: item.consultancy_id,
            year_of_consultancy: normalizeMonthYear(item.year_of_consultancy),
            remarks: item.remarks,
            link: extractLink(item.link),
            academic_year: item.academic_year || ay,
            faculty_involved: ensureFaculty(item.faculty_involved, faculty_id),
            students_involved: Array.isArray(item.students_involved) ? item.students_involved.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no, role: s.role })) : [],
            external_collaborators: Array.isArray(item.external_collaborators) ? item.external_collaborators : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('project_id', item.project_id, project_id, item.consultancy_id
            ? { consultancy_id: item.consultancy_id }
            : {
                type: 'consultancy',
                name_of_project: exactText(item.name_of_project || item.title),
                agency_name: exactText(item.agency_name),
                year_of_consultancy: normalizeMonthYear(item.year_of_consultancy),
                academic_year: item.academic_year || ay
            });
        trackUpsert(item, 'project_id', upsertResearchProject(filter, payload, project_id), ['project_id', 'consultancy_id']);
    }

    for (const item of (research.patents || [])) {
        if (!item.patent_title || !item.application_number || !item.status || !item.date_of_filing) continue;
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const patent_id = item.patent_id || generateId('PAT');
        const payload = cleanEmptyStrings({
            patent_id,
            department_id,
            patent_title: item.patent_title,
            author_names: item.author_names,
            application_number: item.application_number,
            patent_number: item.patent_number,
            status: item.status,
            country: item.country,
            centres: item.centres,
            date_of_filing: parseDate(item.date_of_filing),
            date_of_award: parseDate(item.date_of_award),
            patent_awarding_agency: item.patent_awarding_agency,
            link_to_patent: extractLink(item.link_to_patent),
            academic_year: item.academic_year || ay,
            faculty_members: ensureFaculty(item.faculty_members, faculty_id),
            students: Array.isArray(item.students) ? item.students.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no })) : [],
            external_inventors: Array.isArray(item.external_inventors) ? item.external_inventors : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('patent_id', item.patent_id, patent_id, item.application_number
            ? { application_number: item.application_number }
            : { patent_title: exactText(item.patent_title), date_of_filing: parseDate(item.date_of_filing) });
        trackUpsert(item, 'patent_id', Patent.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'patent_id', patent_id),
            { upsert: true, new: true }
        ));
    }

    for (const item of (research.awards || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const activity_id = item.award_id || generateId('AWD');
        const payload = cleanEmptyStrings({
            activity_id,
            type: 'award',
            faculty_id,
            department_id,
            name_of_award: item.name_of_award,
            type_of_award: item.type_of_award,
            category_of_award: item.category_of_award,
            name_of_organisation: item.name_of_organisation,
            awarding_agency: item.awarding_agency,
            date_of_award: parseDate(item.date_of_award),
            monetary_value: parseNumber(item.monetary_value),
            year: normalizeMonthYear(item.year),
            link: extractLink(item.link),
            evidence_link: extractLink(item.evidence_link),
            academic_year: item.academic_year || ay,
            faculty_recipients: ensureFaculty(item.faculty_recipients, faculty_id),
            student_recipients: Array.isArray(item.student_recipients) ? item.student_recipients.map(s => ({ student_id: s.student_id || s })) : [],
            external_recipients: Array.isArray(item.external_recipients) ? item.external_recipients : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('activity_id', item.award_id, activity_id, {
            type: 'award',
            name_of_award: exactText(item.name_of_award),
            awarding_agency: exactText(item.awarding_agency),
            year: normalizeMonthYear(item.year),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'activity_id', FacultyActivity.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'activity_id', activity_id),
            { upsert: true, new: true }
        ), 'award_id');
    }

    for (const item of (research.e_content || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const activity_id = item.econtent_id || generateId('ECO');
        const payload = cleanEmptyStrings({
            activity_id,
            type: 'econtent',
            faculty_id: item.faculty_id || faculty_id,
            department_id,
            academic_year: item.academic_year || ay,
            course_id: item.course_id,
            name_of_module: item.name_of_module,
            type_of_content: item.type_of_content,
            platform: item.platform,
            platform_type: item.platform_type,
            date_of_launching: parseDate(item.date_of_launching),
            target_audience: item.target_audience,
            duration_hours: parseNumber(item.duration_hours),
            learning_outcome: item.learning_outcome,
            link: extractLink(item.link),
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('activity_id', item.econtent_id, activity_id, {
            type: 'econtent',
            name_of_module: exactText(item.name_of_module),
            course_id: exactText(item.course_id),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'activity_id', FacultyActivity.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'activity_id', activity_id),
            { upsert: true, new: true }
        ), 'econtent_id');
    }

    for (const item of (research.faculty_visits || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const activity_id = item.visit_id || generateId('VIS');
        const payload = cleanEmptyStrings({
            activity_id,
            type: 'visit',
            faculty_id: item.faculty_id || faculty_id,
            department_id,
            academic_year: item.academic_year || ay,
            organisation_name: item.organisation_name,
            title: item.title,
            visit_type: item.visit_type,
            purpose: item.purpose,
            location: item.location,
            start_date: parseDate(item.start_date),
            end_date: parseDate(item.end_date),
            link: extractLink(item.link),
            faculty_participants: Array.isArray(item.faculty_participants) && item.faculty_participants.length
                ? item.faculty_participants.map(f => ({ faculty_id: f.faculty_id || f.emp_code || f, author_type: f.author_type, name: f.name, emp_code: f.emp_code }))
                : (Array.isArray(item.faculty_ids) ? item.faculty_ids.map(fid => ({ faculty_id: fid.faculty_id || fid.emp_code || fid, author_type: fid.author_type, name: fid.name, emp_code: fid.emp_code })) : []),
            student_recipients: Array.isArray(item.student_recipients) && item.student_recipients.length
                ? item.student_recipients.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no, role: s.role }))
                : (Array.isArray(item.student_ids) ? item.student_ids.map(sid => ({ student_id: sid.student_id || sid.roll_no || sid, name: sid.name, roll_no: sid.roll_no, role: sid.role })) : []),
            external_contributors: Array.isArray(item.external_contributors) ? item.external_contributors : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('activity_id', item.visit_id, activity_id, {
            type: 'visit',
            organisation_name: exactText(item.organisation_name),
            title: exactText(item.title),
            start_date: parseDate(item.start_date),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'activity_id', FacultyActivity.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'activity_id', activity_id),
            { upsert: true, new: true }
        ), 'visit_id');
    }

    for (const item of (research.fdps || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const activity_id = item.program_id || generateId('FDP');
        const payload = cleanEmptyStrings({
            activity_id,
            type: 'fdp',
            faculty_id: item.faculty_id || faculty_id,
            department_id,
            academic_year: item.academic_year || ay,
            program_title: item.program_title,
            type_of_program: item.type_of_program,
            type_of_program_other: item.type_of_program_other,
            level: item.level,
            participation_level: item.participation_level,
            amount_for_funding: parseNumber(item.amount_for_funding),
            mode: item.mode,
            organising_body: item.organising_body,
            funding_agency: item.funding_agency,
            venue: item.venue,
            duration_days: parseNumber(item.duration_days),
            start_date: parseDate(item.start_date),
            end_date: parseDate(item.end_date),
            outcome: item.outcome,
            remarks: item.remarks,
            certificate_link: extractLink(item.certificate_link),
            link: extractLink(item.link),
            faculty_participants: Array.isArray(item.faculty_participants) ? item.faculty_participants.map(f => ({ faculty_id: f.faculty_id || f.emp_code || f, author_type: f.author_type, name: f.name, emp_code: f.emp_code })) : [],
            external_participants: Array.isArray(item.external_participants) ? item.external_participants : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('activity_id', item.program_id, activity_id, {
            type: 'fdp',
            program_title: exactText(item.program_title),
            organising_body: exactText(item.organising_body),
            start_date: parseDate(item.start_date),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'activity_id', FacultyActivity.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'activity_id', activity_id),
            { upsert: true, new: true }
        ), ['program_id', 'activity_id']);
    }

    for (const item of (research.collaborations || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const collaboration_id = item.collaboration_id || item.activity_id || generateId('COL');
        const payload = cleanEmptyStrings({
            collaboration_id,
            department_id,
            type: 'activity',
            activity_id: item.activity_id || collaboration_id,
            title: item.title || item.title_of_activity,
            title_of_activity: item.title_of_activity,
            name_of_collaborative_agency: item.name_of_collaborative_agency,
            type_of_activity: item.type_of_activity,
            other_type_of_activity: item.other_type_of_activity,
            nature_of_activity: item.nature_of_collaboration || item.nature_of_activity,
            number_of_participants: parseNumber(item.number_of_participants),
            source_of_financial_support: item.source_of_financial_support,
            funding_amount: parseNumber(item.funding_amount),
            year: normalizeMonthYear(item.year),
            duration: item.duration,
            level: item.level,
            start_date: parseDate(item.start_date),
            end_date: parseDate(item.end_date),
            academic_year: item.academic_year || ay,
            remarks: item.remarks,
            link: extractLink(item.link),
            faculty_associations: ensureFaculty(item.faculty_associations || item.faculty_involved, faculty_id),
            student_associations: Array.isArray(item.students_involved)
                ? item.students_involved.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no }))
                : (Array.isArray(item.student_associations) ? item.student_associations.map(s => ({ student_id: s.student_id || s.roll_no || s, name: s.name, roll_no: s.roll_no })) : []),
            external_contributors: Array.isArray(item.external_contributors)
                ? item.external_contributors
                : (Array.isArray(item.external_collaborators) ? item.external_collaborators : []),
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('collaboration_id', item.collaboration_id || item.activity_id, collaboration_id, {
            type: 'activity',
            title_of_activity: exactText(item.title_of_activity || item.title),
            name_of_collaborative_agency: exactText(item.name_of_collaborative_agency),
            year: normalizeMonthYear(item.year),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'collaboration_id', Collaboration.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'collaboration_id', collaboration_id),
            { upsert: true, new: true }
        ), ['collaboration_id', 'activity_id']);
    }

    for (const item of (research.mous || [])) {
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const collaboration_id = item.collaboration_id || item.mou_id || generateId('COL');
        const payload = cleanEmptyStrings({
            collaboration_id,
            department_id,
            type: 'mou',
            mou_id: item.mou_id || collaboration_id,
            organisation_name: item.organisation_name,
            title: item.title,
            type_of_mou: item.type_of_mou,
            year_of_signing: normalizeMonthYear(item.year_of_signing),
            purpose: item.purpose,
            activities_under_mou: item.activities_under_mou,
            start_date: parseDate(item.start_date),
            end_date: parseDate(item.end_date),
            level: item.level,
            academic_year: item.academic_year || ay,
            link: extractLink(item.link),
            faculty_associations: ensureFaculty(item.faculty_associations || item.faculty_involved, faculty_id),
            student_associations: (Array.isArray(item.student_associations) && item.student_associations.length)
                ? item.student_associations
                : (Array.isArray(item.students_involved) ? item.students_involved.map(s => ({ student_id: s.student_id || s.student || s, role: s.role })) : []),
            external_contributors: Array.isArray(item.external_contributors)
                ? item.external_contributors
                : (Array.isArray(item.external_collaborators) ? item.external_collaborators : []),
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('collaboration_id', item.collaboration_id || item.mou_id, collaboration_id, {
            type: 'mou',
            organisation_name: exactText(item.organisation_name),
            title: exactText(item.title),
            year_of_signing: normalizeMonthYear(item.year_of_signing),
            academic_year: item.academic_year || ay
        });
        trackUpsert(item, 'collaboration_id', Collaboration.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'collaboration_id', collaboration_id),
            { upsert: true, new: true }
        ), ['collaboration_id', 'mou_id']);
    }

    for (const item of (research.phd_supervision || [])) {
        // Ensure mandatory fields from model; skip if missing critical data
        if (!item.student_id || !item.enrollment_no || !item.student_name || !item.thesis_title || !item.thesis_type || !item.supervisor_id || !item.supervisor_name || !item.date_of_defence || !(item.academic_year || ay)) continue;
        const department_id = await normalizeDepartmentId(item.department_id || deptIdFallback);
        const defence_id = item.defence_id || generateId('PHD');
        const payload = cleanEmptyStrings({
            defence_id,
            student_id: item.student_id,
            department_id,
            enrollment_no: item.enrollment_no,
            student_name: item.student_name,
            thesis_title: item.thesis_title,
            thesis_type: item.thesis_type,
            supervisor_id: item.supervisor_id || faculty_id,
            supervisor_name: item.supervisor_name,
            date_of_admission: parseDate(item.date_of_admission),
            date_of_src: parseDate(item.date_of_src),
            date_of_defence: parseDate(item.date_of_defence),
            date_of_result_notification: parseDate(item.date_of_result_notification),
            result_outcome: item.result_outcome || item.status,
            registration_year: normalizeMonthYear(item.registration_year),
            academic_year: item.academic_year || ay,
            remarks: item.remarks,
            link: extractLink(item.link),
            co_supervisors: Array.isArray(item.co_supervisors) ? item.co_supervisors.map(cs => ({
                affiliation_type: cs.affiliation_type || (cs.external_name ? 'External' : 'Internal'),
                co_supervisor_id: cs.co_supervisor_id || cs.faculty_id,
                external_name: cs.external_name,
                external_affiliation: cs.external_affiliation || cs.affiliation
            })) : [],
            committee_members: Array.isArray(item.committee_members) ? item.committee_members : [],
            external_examiners: Array.isArray(item.external_examiners) ? item.external_examiners : [],
            metadata: { created_by: faculty_id, change_log: [{ action: 'updated', user_id: faculty_id, changes: 'Synced from APAR monthly save' }] }
        });
        const filter = buildUpsertFilter('defence_id', item.defence_id, defence_id, item.student_id
            ? { student_id: item.student_id, thesis_title: exactText(item.thesis_title), registration_year: normalizeMonthYear(item.registration_year) }
            : { thesis_title: exactText(item.thesis_title), date_of_defence: parseDate(item.date_of_defence) });
        trackUpsert(item, 'defence_id', PhdDefence.findOneAndUpdate(
            filter,
            buildUpsertUpdate(payload, 'defence_id', defence_id),
            { upsert: true, new: true }
        ));
    }

    await Promise.all(upserts);

    const formUpdate = {
        research,
        monthly_saved_at: new Date()
    };

    if (formData.personal) formUpdate.personal = formData.personal;
    if (formData.teaching) formUpdate.teaching = formData.teaching;
    if (formData.corporate) formUpdate.corporate = formData.corporate;

    const form = await AparForm.findOneAndUpdate(
        { faculty_id, ay },
        {
            $set: formUpdate,
            $setOnInsert: { status: 'Draft' }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    try { await preventCrossFacultyDuplicates(faculty_id, ay, research); } catch (e) { console.warn('Cross-faculty duplicate prevention failed:', e?.message); }

    return res.status(200).json(new ApiResponse(200, { monthly_saved_at: form.monthly_saved_at, research }, 'Section III saved to monthly collections'));
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

    const assignedUsers = await User.find({ reporting_officer_id: { $in: possibleOfficerIds } });
    const assignedUserIds = assignedUsers.map(u => u.user_id);

    const query = {
        $or: [
            { faculty_id: { $in: assignedUserIds } },
            { reporting_officer_id: { $in: possibleOfficerIds } }
        ]
    };

    if (req.query.archive === 'true') {
        // Archive: Show all forms regardless of status (or maybe just completed ones?)
        // User said: "make it availabel to him as archive and only in view form"
        // Let's show everything for now, or maybe filter out 'Draft' if we want strictly submitted history.
    } else {
        // Pending Action: Only forms needing attention
        query.status = { $in: ['Submitted', 'Query Raised', 'Query Raised by Reviewing officer'] };
    }

    if (ay) query.ay = ay;

    // console.log(`[REPORTING VIEW] Querying Forms:`, JSON.stringify(query));
    const forms = await AparForm.find(query).sort({ updatedAt: -1 }).lean();
    // console.log(`[REPORTING VIEW] Forms found: ${forms.length}`);

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
    const reportingKey = req.user?.userId || req.user?.faculty_id || req.user?.id;

    const { faculty_id, ay, assessment, status } = req.body;
    await assertFacultyAccess(req.user, faculty_id);
    const isQuery = Boolean(status && status.includes('Query'));
    const allowedStatuses = new Set(['Forwarded by Reporting officer', 'Query Raised by Reporting officer']);
    if (!allowedStatuses.has(status)) {
        throw new ApiError(400, "Reporting Officer can only raise a query or forward the APAR");
    }

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
    if (isQuery) {
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
            type: isQuery ? 'APAR_SUBMISSION' : 'APAR_REVIEW_REQUEST',
            title: isQuery ? 'Query Raised on APAR' : 'APAR Verified by Reporting Officer',
            message: isQuery
                ? `Reporting Officer has raised a query on your APAR for AY ${ay}.`
                : `Your APAR for AY ${ay} has been verified by the Reporting Officer.`,
            link: '/apar-form'
        });

        // 2. Notify Reviewing Officer only if assessment is successfully forwarded
        if (!isQuery && facultyUser?.reviewing_officer_id) {
            await createNotification({
                recipient: facultyUser.reviewing_officer_id,
                sender: reportingKey,
                type: 'APAR_REVIEW_REQUEST',
                title: 'APAR Review Pending',
                message: `APAR for ${facultyUser.name || faculty_id} (AY ${ay}) is verified and pending your review.`,
                link: '/apar/reporting'
            });
        }
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

    // console.log(`[REVIEWING VIEW] Checking assignments for Officer IDs: ${possibleOfficerIds.join(', ')}`);

    // Direct query to User model
    const assignedUsers = await User.find({ reviewing_officer_id: { $in: possibleOfficerIds } });
    const assignedUserIds = assignedUsers.map(u => u.user_id);
    // console.log(`[REVIEWING VIEW] Found ${assignedUsers.length} assigned users: ${assignedUserIds.join(', ')}`);


    const query = {
        $or: [
            { faculty_id: { $in: assignedUserIds } },
            { reviewing_officer_id: { $in: possibleOfficerIds } }
        ]
    };

    if (req.query.archive === 'true') {
        query.status = { $ne: 'Draft' };
    } else {
        query.status = {
            $in: [
                'Forwarded by Reporting officer'
            ]
        };
    }

    if (ay) query.ay = ay;

    // console.log(`[REVIEWING VIEW] Querying Forms:`, JSON.stringify(query));
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
    await assertFacultyAccess(req.user, faculty_id);
    const finalStatus = status || "Accepted by Reviewing officer";
    const allowedStatuses = new Set(['Accepted by Reviewing officer', 'Query Raised by Reviewing officer']);
    if (!allowedStatuses.has(finalStatus)) {
        throw new ApiError(400, "Reviewing Officer can only raise a query or accept the APAR");
    }

    const updateData = {
        remarks: remarks,
        status: finalStatus, // Final status or Query
    };

    if (finalStatus.includes('Query')) {
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
        action: finalStatus,
        by: "Reviewing Officer",
        date: new Date(),
        comment: query_comment || (finalStatus === 'Accepted by Reviewing officer' ? 'Accepted by Reviewing Officer' : finalStatus)
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
            type: finalStatus.includes('Query') ? 'APAR_SUBMISSION' : 'APAR_COMPLETED',
            title: finalStatus.includes('Query') ? 'Query Raised by Reviewing Officer' : 'APAR Review Completed',
            message: finalStatus.includes('Query')
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

    const query = await buildListFormsQuery(req.user, ay);
    const forms = await AparForm.find(query).sort({ updatedAt: -1 });
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

const getDeanAparStatus = asyncHandler(async (req, res) => {
    const role = normalizeRoleValue(req.user?.role);
    if (role !== APAR_ROLES.DEAN) {
        throw new ApiError(403, "Only Dean accounts can view Dean APAR status");
    }

    const ay = normalizeAY(req.query.ay);
    if (!ay) {
        throw new ApiError(400, "Academic year (ay) is required");
    }

    // Allow department filter from query param, fallback to user's mapped department
    const departmentId = req.query.department_id || req.user?.departmentId;
    if (!departmentId) {
        throw new ApiError(400, "Department ID is required (either from query or user mapping)");
    }

    const [facultyProfiles, departmentUsers] = await Promise.all([
        Faculty.find({ department_id: departmentId })
            .select('faculty_id name email designation department_id')
            .lean(),
        User.find({ department_id: departmentId })
            .select('user_id name email designation role department_id')
            .lean()
    ]);

    const usersById = new Map(departmentUsers.map((user) => [user.user_id, user]));
    const facultyById = new Map();

    for (const faculty of facultyProfiles) {
        const user = usersById.get(faculty.faculty_id);
        if (user?.role === 'Dean' || user?.role === 'IQAC Head') {
            continue;
        }
        facultyById.set(faculty.faculty_id, {
            faculty_id: faculty.faculty_id,
            name: faculty.name,
            email: faculty.email,
            designation: faculty.designation,
            department_id: faculty.department_id,
            role: user?.role || 'Faculty Member'
        });
    }

    for (const user of departmentUsers) {
        if (!user.user_id || user.role === 'Dean' || user.role === 'IQAC Head') {
            continue;
        }
        if (!facultyById.has(user.user_id)) {
            facultyById.set(user.user_id, {
                faculty_id: user.user_id,
                name: user.name,
                email: user.email,
                designation: user.designation,
                department_id: user.department_id,
                role: user.role
            });
        }
    }

    const facultyIds = [...facultyById.keys()];
    const forms = facultyIds.length
        ? await AparForm.find({ ay, faculty_id: { $in: facultyIds } })
            .select('faculty_id ay status updatedAt createdAt timeline')
            .lean()
        : [];
    const formsByFacultyId = new Map(forms.map((form) => [form.faculty_id, form]));

    const rows = [...facultyById.values()]
        .map((faculty) => {
            const form = formsByFacultyId.get(faculty.faculty_id);
            const status = form?.status || 'Not Filled';
            const hasSubmitted = Boolean(
                form?.timeline?.submitted_at
                || (form && !['Draft', 'Not Filled', 'not_filled'].includes(status))
            );

            return {
                faculty_id: faculty.faculty_id,
                name: faculty.name || faculty.faculty_id,
                email: faculty.email || null,
                designation: faculty.designation || null,
                department_id: faculty.department_id,
                role: faculty.role || null,
                ay,
                status,
                hasSubmitted,
                submittedAt: form?.timeline?.submitted_at || null,
                updatedAt: form?.updatedAt || null
            };
        })
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    const submittedCount = rows.filter((row) => row.hasSubmitted).length;

    return res.status(200).json(new ApiResponse(200, {
        ay,
        departmentId,
        totalFaculty: rows.length,
        submittedCount,
        notSubmittedCount: rows.length - submittedCount,
        rows
    }, "Dean APAR status fetched"));
});

const getFacultyInfo = asyncHandler(async (req, res) => {
    let faculty_id = req.user?.userId || req.user?.faculty_id || req.user?.id;
    faculty_id = await resolveToReadableId(faculty_id);
    await assertFacultyAccess(req.user, faculty_id);

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

        // console.log(`✅ Removed duplicate ${entryType} from ${otherFacultyId}'s draft`);
    }
};

/**
 * Check if two entries are duplicates
 */
const isDuplicateEntry = (entry1, entry2, type) => {
    if (!entry1 || !entry2) return false;

    // Helper to normalize strings: lowercase, trim
    const normalize = (str) => String(str || '').trim().toLowerCase();

    // Helper to normalize month-year for comparison
    const normalizeYear = (val) => normalize(normalizeMonthYear(val));

    // Helper: compares if ALL keys match
    // But entries structure might differ slightly, so we stick to key fields

    switch (type) {
        case 'journals':
            // Check Title AND Journal Name AND Year
            return normalize(entry1.title || entry1.title_of_paper) === normalize(entry2.title || entry2.title_of_paper) &&
                normalize(entry1.name_of_journal) === normalize(entry2.name_of_journal) &&
                normalizeYear(entry1.year_of_publication) === normalizeYear(entry2.year_of_publication || entry2.year);

        case 'conferences':
            // Check Title AND Conference Name AND Year
            return normalize(entry1.title || entry1.title_of_paper) === normalize(entry2.title || entry2.title_of_paper) &&
                normalize(entry1.name_of_conference) === normalize(entry2.name_of_conference) &&
                normalizeYear(entry1.year_of_publication) === normalizeYear(entry2.year_of_publication);

        case 'books':
            // Check Book Title OR ISBN (if available)
            if (entry1.isbn_number && entry2.isbn_number) {
                return normalize(entry1.isbn_number) === normalize(entry2.isbn_number);
            }
            return normalize(entry1.title_of_book) === normalize(entry2.title_of_book) &&
                normalize(entry1.title_of_chapter) === normalize(entry2.title_of_chapter) &&
                normalizeYear(entry1.year) === normalizeYear(entry2.year);

        case 'patents':
            return normalize(entry1.patent_title) === normalize(entry2.patent_title) &&
                normalize(entry1.application_number) === normalize(entry2.application_number);

        case 'projects':
            return normalize(entry1.title_research || entry1.title) === normalize(entry2.title_research || entry2.title) &&
                normalize(entry1.funding_agency_name) === normalize(entry2.funding_agency_name) &&
                normalizeYear(entry1.year_of_sanction) === normalizeYear(entry2.year_of_sanction);

        default:
            return false;
    }
};

export {
    getForm,
    getFacultyHistory,
    getFacultyHistoryByDean,
    deleteForm,
    saveForm,
    submitForm,
    saveToMonthly,
    getPendingReporting,
    submitReportingAssessment,
    getPendingReviewing,
    submitReviewingRemarks,
    listAllForms,
    getDeanAparStatus,
    getFacultyInfo,
    syncIqacToAparForm  // Export for auto-sync utility
};
