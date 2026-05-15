import mongoose from 'mongoose';

/**
 * Faculty Activity Model
 * Supports: faculty_development_programs, faculty_visits, professional_affiliations, 
 *           teachers_using_ict, research_innovation_awards, developed_e_contents, 
 *           financial_support_events (tableConfig.js)
 * Uses 'type' discriminator: 'fdp' | 'visit' | 'affiliation' | 'ict' | 'award' | 'econtent' | 'financial_support'
 */
const FacultyActivitySchema = new mongoose.Schema({
    activity_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    faculty_id: { type: String, index: true },
    department_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['fdp', 'visit', 'affiliation', 'ict', 'award', 'econtent', 'financial_support'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    academic_year: String,
    start_date: Date,
    end_date: Date,
    outcome: String,
    remarks: String,
    link: String,

    // -------------------------------------------------------------------------
    // FDP-specific (type: 'fdp')
    // tableConfig: program_id, program_title, type_of_program, level, mode, etc.
    // -------------------------------------------------------------------------
    program_id: String, // Alternate key
    program_title: String,
    type_of_program: String,
    level: String, // Institutional/National/International
    mode: String, // Online/Offline/Hybrid
    duration_days: Number,
    organising_body: String,
    funding_agency: String,
    venue: String,
    certificate_link: String,
    faculty_participants: [{ faculty_id: String, role: String }],
    external_participants: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    // -------------------------------------------------------------------------
    // Visit-specific (type: 'visit')
    // tableConfig: visit_id, organisation_name, title, visit_type, purpose, location, etc.
    // -------------------------------------------------------------------------
    visit_id: String, // Alternate key
    organisation_name: String,
    title: String,
    visit_type: String, // Industrial Visit/Collaborative Research/Guest Lecture/etc.
    purpose: String,
    location: String,

    // -------------------------------------------------------------------------
    // Affiliation-specific (type: 'affiliation')
    // tableConfig: affiliation_id, professional_body_name, membership_id, etc.
    // -------------------------------------------------------------------------
    affiliation_id: String, // Alternate key
    professional_body_name: String,
    membership_id: String,
    type_of_membership: String, // Life/Annual
    position_held: String,
    area_of_support: String,
    status: String, // Active/Expired/Lifetime

    // -------------------------------------------------------------------------
    // ICT-specific (type: 'ict')
    // tableConfig: ict_id, course_name, semester, ict_mode, ict_tools_used, etc.
    // -------------------------------------------------------------------------
    ict_id: String, // Alternate key
    course_name: String,
    semester: String,
    ict_mode: String, // Online/Offline/Blended/Flipped Classroom/Smart Class
    ict_tools_used: [String],
    faculty_name: String,
    ict_classroom_rooms: [String],
    e_resources_and_techniques_used: String,
    no_of_ict_enabled_classrooms: Number,
    impact: String,
    evidence_link: String,

    // -------------------------------------------------------------------------
    // Award-specific (type: 'award')
    // tableConfig: award_id, name_of_award, type_of_award, category_of_award, etc.
    // -------------------------------------------------------------------------
    award_id: String, // Alternate key
    name_of_award: String,
    type_of_award: String, // Research/Innovation/Teaching Excellence/Patent/Startup/Other
    category_of_award: String,
    name_of_organisation: String,
    awarding_agency: String,
    date_of_award: Date,
    monetary_value: Number,
    year: Number,
    faculty_recipients: [{ faculty_id: String, role: String }],
    student_recipients: [{ student_id: String, role: String }],
    external_recipients: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    // -------------------------------------------------------------------------
    // E-content-specific (type: 'econtent')
    // tableConfig: econtent_id, name_of_module, type_of_content, platform, etc.
    // -------------------------------------------------------------------------
    econtent_id: String, // Alternate key
    course_id: String,
    name_of_module: String,
    type_of_content: String, // Video/Module/Quiz/PPT/Simulation/eBook/Other
    platform: String,
    platform_type: String, // LMS/MOOC/YouTube/SWAYAM/Internal/Other
    date_of_launching: Date,
    target_audience: String, // UG/PG/PhD/Faculty/Students/Mixed
    duration_hours: Number,
    learning_outcome: String,

    // -------------------------------------------------------------------------
    // Financial support-specific (type: 'financial_support')
    // tableConfig: support_id, title_of_event, event_type, level, etc.
    // -------------------------------------------------------------------------
    support_id: String, // Alternate key
    title_of_event: String,
    event_type: String, // Conference/Workshop/Seminar/FDP/STTP/Symposium/Other
    host_institution: String,
    amount: Number,
    date_start: Date,
    date_end: Date,
    external_contributors: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        created_by: { type: String, default: null },
        change_log: [{
            action: { type: String, enum: ['created', 'updated'] },
            user_id: String,
            timestamp: { type: Date, default: Date.now },
            changes: String
        }]
    }
}, {
    timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
    collection: 'faculty_activities'
});

// Compound indexes for type-based queries
FacultyActivitySchema.index({ type: 1, faculty_id: 1 });
FacultyActivitySchema.index({ type: 1, department_id: 1 });
FacultyActivitySchema.index({ type: 1, academic_year: 1 });

export const FacultyActivity = mongoose.model('FacultyActivity', FacultyActivitySchema);
