import mongoose from 'mongoose';

/**
 * Department Model - Simplified to core department information only
 * All nested arrays (students, courses, infrastructure, etc.) moved to separate collections
 */
const DepartmentSchema = new mongoose.Schema({
    // -------------------------------------------------------------------------
    // Primary Key
    // -------------------------------------------------------------------------
    department_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Core Department Info
    // -------------------------------------------------------------------------
    department_name: { type: String, required: true },
    head_of_department: { type: String, required: true },
    contact_email: { type: String, required: true },
    contact_phone: { type: String, required: true },
    location: String,

    // -------------------------------------------------------------------------
    // Recognitions (kept as small array, department-specific)
    // -------------------------------------------------------------------------
    recognitions: [{
        recognition_id: String,
        name_of_agency: String, // UGC-SAP, CAS, DST-FIST, DBT, ICSSR etc
        year_of_award: Number,
        type: { type: String },
        link: String
    }],

    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        created_by: { type: String, default: null },
        change_log: [{
            action: { type: String, enum: ['created', 'updated', 'deleted'] },
            user_id: { type: String, default: null },
            timestamp: { type: Date, default: Date.now },
            changes: { type: Map, of: mongoose.Schema.Types.Mixed }
        }]
    }

}, {
    timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
    collection: 'departments'
});

// Indexes
DepartmentSchema.index({ department_name: 'text' });

export const Department = mongoose.model('Department', DepartmentSchema);
