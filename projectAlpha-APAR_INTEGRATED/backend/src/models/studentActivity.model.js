import mongoose from 'mongoose';

/**
 * Student Activity Model
 * Supports: students_competitive_exams, students_higher_education_placements,
 *           student_performance_activities, student_financial_support_events (tableConfig.js)
 * Uses 'type' discriminator: 'exam' | 'higher_ed' | 'performance' | 'financial_support'
 */
const StudentActivitySchema = new mongoose.Schema({
    activity_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    student_id: { type: String, index: true },
    department_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['exam', 'higher_ed', 'performance', 'financial_support'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    student_name: String,
    academic_year: String,
    remarks: String,
    link: String,

    // -------------------------------------------------------------------------
    // Exam-specific (type: 'exam')
    // tableConfig: exam_record_id, student_id, name_of_exam, type_of_exam, etc.
    // -------------------------------------------------------------------------
    exam_record_id: String, // Alternate key
    name_of_exam: String,
    type_of_exam: String, // Government/PSU/GATE/GRE/Other
    level_of_exam: String, // Institutional/State/National/International
    year_of_qualifying: Number,
    rank_or_score: String,
    attempt_number: Number,
    programme_applied_for: String,
    result_status: String, // Qualified/Passed/Not Qualified/Other

    // -------------------------------------------------------------------------
    // Higher education-specific (type: 'higher_ed')
    // tableConfig: record_id, student_id, institution_joined, country, etc.
    // -------------------------------------------------------------------------
    record_id: String, // Alternate key
    institution_joined: String,
    country: String,
    level_of_study: String, // UG/PG/PhD/Diploma/Certificate/Other
    programme_type: String, // Full-time/Part-time/Online/Exchange/Other
    details_of_programme: String,
    mentor_name: String,
    year_of_joining: Number,
    current_status: String, // Ongoing/Completed/Placed/Other

    // -------------------------------------------------------------------------
    // Performance-specific (type: 'performance')
    // tableConfig: performance_id, name_of_award, type_of_activity, level_of_award, etc.
    // -------------------------------------------------------------------------
    performance_id: String, // Alternate key
    name_of_award: String,
    type_of_activity: String, // Sports/Cultural/Academic/Innovation/Other
    level_of_award: String, // Institutional/State/National/International
    category: String,
    position_or_rank: String,
    organizing_body: String,
    year: Number,
    outcome: String,
    students: [{ student_id: String, student_aadhar: String, role: String }],
    external_participants: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    // -------------------------------------------------------------------------
    // Financial support-specific (type: 'financial_support')
    // tableConfig: support_id, name_of_event, type_of_support, funding_agency, etc.
    // -------------------------------------------------------------------------
    support_id: String, // Alternate key
    name_of_event: String,
    type_of_support: String, // Scholarship/Travel Grant/Fellowship/Award/Other
    funding_agency: String,
    amount_of_support: Number,
    date_of_event: Date,
    students_supported: [{ student_id: String, student_name: String, amount: Number, pan_no: String }],
    external_recipients: [{
        name: String,
        email: String,
        amount: Number,
        pan_no: String
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
    collection: 'student_activities'
});

// Compound indexes for type-based queries
StudentActivitySchema.index({ type: 1, student_id: 1 });
StudentActivitySchema.index({ type: 1, department_id: 1 });
StudentActivitySchema.index({ type: 1, academic_year: 1 });

export const StudentActivity = mongoose.model('StudentActivity', StudentActivitySchema);
