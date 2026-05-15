import mongoose from 'mongoose';

/**
 * Faculty Model - Simplified to profile information only
 * All activity data (papers, patents, awards, etc.) moved to separate collections
 */
const FacultySchema = new mongoose.Schema({
    // -------------------------------------------------------------------------
    // Primary Key
    // -------------------------------------------------------------------------
    faculty_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Authentication (migrated from users table)
    // -------------------------------------------------------------------------
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    // password_hash and role removed as they are now managed in User table

    // -------------------------------------------------------------------------
    // Profile Information
    // -------------------------------------------------------------------------
    name: { type: String, required: true },
    gender: String,
    date_of_birth: Date,
    designation: { type: String, required: true },
    department_id: { type: String, required: true, index: true },
    qualification: String,
    specialization: String,
    joining_date: Date,
    employment_type: String,
    phone: String,

    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        migrated_from_sql_at: Date,
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
    collection: 'faculty'
});

// Indexes for common queries
// Note: faculty_id, email, department_id already have index: true in schema
FacultySchema.index({ name: 'text', email: 'text' });

export const Faculty = mongoose.model('Faculty', FacultySchema);
