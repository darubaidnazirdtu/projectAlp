import mongoose from 'mongoose';

/**
 * Training Model
 * Supports: staff_trainings, professional_staff_trainings, 
 *           mentor_stress_support_sessions, capability_enhancement_schemes (tableConfig.js)
 * Uses 'type' discriminator: 'staff' | 'professional' | 'mentoring' | 'capability'
 */
const TrainingSchema = new mongoose.Schema({
    training_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    department_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['staff', 'professional', 'mentoring', 'capability'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    title: String, // Generic title field used by all types
    type_of_training: String,
    mode: String, // Online/Offline/Hybrid
    semester: String,
    start_date: Date,
    end_date: Date,
    academic_year: String,
    outcome: String,
    remarks: String,
    link: String,

    // -------------------------------------------------------------------------
    // Staff training-specific (type: 'staff')
    // tableConfig: training_record_id, name_of_official, program_name, etc.
    // -------------------------------------------------------------------------
    training_record_id: String, // Alternate key
    name_of_official: String,
    program_name: String,
    organising_agency: String,
    funding_details: String,
    participants: [{ faculty_id: String, role: String }],

    // -------------------------------------------------------------------------
    // Professional training-specific (type: 'professional')
    // tableConfig: training_id, title_of_event, type_of_training, etc.
    // -------------------------------------------------------------------------
    title_of_event: String,
    year_of_training: Number,
    number_of_participants: Number,
    sponsoring_agencies: String,
    faculty_participants: [{ faculty_id: String, role: String }],
    student_participants: [{ student_id: String, role: String }],
    external_participants: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    // -------------------------------------------------------------------------
    // Mentoring-specific (type: 'mentoring')
    // tableConfig: mentor_record_id, faculty_id, activity_type, etc.
    // -------------------------------------------------------------------------
    mentor_record_id: String, // Alternate key
    faculty_id: String,
    activity_type: String, // Mentorship/Counselling Session/Stress Management Workshop/Motivational Talk/Other
    mentor_mentee_ratio: String,
    target_group: String, // Students/Faculty/Staff/Mixed
    date_of_activity: Date,
    duration_hours: Number,
    organizer_name: String,
    mentor_name: String,
    student_details: String,
    feedback_summary: String,
    evidence_link: String,

    // -------------------------------------------------------------------------
    // Capability enhancement-specific (type: 'capability')
    // tableConfig: scheme_id, name_of_scheme, type_of_scheme, etc.
    // -------------------------------------------------------------------------
    scheme_id: String, // Alternate key
    name_of_scheme: String,
    type_of_scheme: String, // Soft Skills/Language/Remedial Classes/ICT Tools/Other
    no_of_students_enrolled: Number,
    name_of_agencies_involved: String,
    faculty_ids: [{ faculty_id: String, role: String }],
    student_ids: [{ student_id: String, role: String }],
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
    collection: 'trainings'
});

// Compound indexes for type-based queries
TrainingSchema.index({ type: 1, department_id: 1 });
TrainingSchema.index({ type: 1, academic_year: 1 });
TrainingSchema.index({ faculty_id: 1 });

export const Training = mongoose.model('Training', TrainingSchema);
