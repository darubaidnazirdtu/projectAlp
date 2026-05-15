import mongoose from 'mongoose';

/**
 * Research Project Model
 * Supports: research_funding_grants, revenue_from_consultancies, revenue_from_corporate_trainings (tableConfig.js)
 * Uses 'type' discriminator: 'funding' | 'consultancy' | 'corporate_training'
 */
const ResearchProjectSchema = new mongoose.Schema({
    project_id: {
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
        enum: ['funding', 'consultancy', 'corporate_training'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    title: String, // Generic title field used by all types
    start_date: Date,
    end_date: Date,
    status: String,
    outcome: String,
    remarks: String,
    link: String,
    academic_year: String,

    // -------------------------------------------------------------------------
    // Funding-specific (type: 'funding')
    // tableConfig accessor: funding_id, title_research, funding_agency_name, etc.
    // -------------------------------------------------------------------------
    funding_id: String, // Alternate key
    title_research: String,
    type_of_project: String,
    funding_agency_name: String,
    funding_type: String, // Government/Non-Government
    sanction_number: String,
    year_of_sanction: Number,
    amount: Number,
    chair_holder: String,

    // -------------------------------------------------------------------------
    // Consultancy-specific (type: 'consultancy')
    // tableConfig accessor: consultancy_id, name_of_project, agency_name, etc.
    // -------------------------------------------------------------------------
    consultancy_id: String, // Alternate key
    name_of_project: String,
    agency_name: String,
    type_of_agency: String,
    consultancy_type: String,
    grant_amount: Number,
    revenue_generated: Number,
    duration_start_date: Date,
    year_of_consultancy: Number,

    // -------------------------------------------------------------------------
    // Corporate training-specific (type: 'corporate_training')
    // tableConfig accessor: training_id, name_of_program, etc.
    // -------------------------------------------------------------------------
    training_id: String, // Alternate key
    name_of_program: String,
    mode_of_training: String,
    no_of_participants: Number,
    year_of_training: Number,
    agency_contact_details: String,
    number_of_faculties: Number,
    number_of_students: Number,
    number_of_external_trainees: Number,

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------
    faculty_involved: [{ faculty_id: String, role: String }],
    students_involved: [{ student_id: String, role: String }],
    external_collaborators: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],
    external_consultants: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],
    external_trainers: [{
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
    collection: 'research_projects'
});

ResearchProjectSchema.index({ type: 1, department_id: 1 });
ResearchProjectSchema.index({ type: 1, status: 1 });
ResearchProjectSchema.index({ 'faculty_involved.faculty_id': 1 });

export const ResearchProject = mongoose.model('ResearchProject', ResearchProjectSchema);
