import mongoose from 'mongoose';

/**
 * Collaboration Model
 * Supports: collaborative_activities, collaborative_research_exchanges, 
 *           functional_mous, extension_outreach_activities (tableConfig.js)
 * Uses 'type' discriminator: 'activity' | 'exchange' | 'mou' | 'outreach'
 */
const CollaborationSchema = new mongoose.Schema({
    collaboration_id: {
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
        enum: ['activity', 'exchange', 'mou', 'outreach'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    title: String, // Generic title field used by all types
    level: String, // Institutional/National/International
    start_date: Date,
    end_date: Date,
    academic_year: String,
    outcome: String,
    remarks: String,
    link: String,

    // -------------------------------------------------------------------------
    // Activity-specific (type: 'activity')
    // tableConfig: activity_id, title_of_activity, name_of_collaborative_agency, etc.
    // -------------------------------------------------------------------------
    activity_id: String, // Alternate key
    title_of_activity: String,
    name_of_collaborative_agency: String,
    type_of_activity: String, // Workshop/Seminar/Industrial Visit/Research Collaboration/MoU/Joint Program/Other
    number_of_participants: Number,
    source_of_financial_support: String,
    funding_amount: Number,
    year: Number,
    duration: String,
    nature_of_activity: String,

    // -------------------------------------------------------------------------
    // Exchange-specific (type: 'exchange')
    // tableConfig: collaboration_id, type_of_activity, name_of_institution, etc.
    // -------------------------------------------------------------------------
    name_of_institution: String,
    funding_agency: String,
    nature_of_collaboration: String,

    // -------------------------------------------------------------------------
    // MOU-specific (type: 'mou')
    // tableConfig: mou_id, organisation_name, type_of_mou, level, etc.
    // -------------------------------------------------------------------------
    mou_id: String, // Alternate key
    organisation_name: String,
    type_of_mou: String, // Academic/Research/Industry/Consultancy/Training/Other
    year_of_signing: Number,
    purpose: String,
    activities_under_mou: [{
        activity_title: String,
        activity_date: Date,
        activity_description: String
    }],

    // -------------------------------------------------------------------------
    // Outreach-specific (type: 'outreach')
    // tableConfig: activity_id, title_of_activity, type_of_activity, location, etc.
    // -------------------------------------------------------------------------
    location: String,
    geo_tag_location_link: String,
    no_of_participants: Number,
    target_beneficiaries: String,
    sponsoring_agency: String,

    // -------------------------------------------------------------------------
    // Relationships (common for most types)
    // -------------------------------------------------------------------------
    faculty_associations: [{ faculty_id: String, role: String }],
    student_associations: [{ student_id: String, role: String }],
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
    collection: 'collaborations'
});

// Compound indexes for type-based queries
CollaborationSchema.index({ type: 1, department_id: 1 });
CollaborationSchema.index({ type: 1, academic_year: 1 });
CollaborationSchema.index({ 'faculty_associations.faculty_id': 1 });

export const Collaboration = mongoose.model('Collaboration', CollaborationSchema);
