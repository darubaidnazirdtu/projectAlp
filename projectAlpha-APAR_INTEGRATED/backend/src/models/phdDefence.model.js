import mongoose from 'mongoose';

/**
 * PhD Defence Model
 * Supports: phd_defences (tableConfig.js)
 */
const PhdDefenceSchema = new mongoose.Schema({
    defence_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    student_id: { type: String, required: true, index: true },
    department_id: {
        type: String,
        required: true,
        index: true
    },
    enrollment_no: { type: String, required: true },
    student_name: { type: String, required: true },
    thesis_title: { type: String, required: true },
    thesis_type: { type: String, required: true }, // Full-time/Part-time/Sponsored/Industry-linked/Other
    supervisor_id: { type: String, required: true, index: true },
    supervisor_name: { type: String, required: true },
    date_of_admission: { type: Date },
    date_of_src: { type: Date },
    date_of_defence: { type: Date, required: true },
    date_of_result_notification: Date,
    result_outcome: { type: String, required: true }, // Accepted/Minor Revision/Major Revision/Rejected/Other
    academic_year: { type: String, required: true },
    remarks: String,
    link: String,

    // Co-supervisors and committee members
    co_supervisors: [{ 
        affiliation_type: { type: String, enum: ['Internal', 'External'], default: 'Internal' },
        co_supervisor_id: String,
        external_name: String,
        external_affiliation: String
    }],
    committee_members: [{ member_id: String, role: String }],
    external_examiners: [{
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
    collection: 'phd_defences'
});

PhdDefenceSchema.index({ department_id: 1, academic_year: 1 });
// Note: supervisor_id already has index: true in schema definition

export const PhdDefence = mongoose.model('PhdDefence', PhdDefenceSchema);
