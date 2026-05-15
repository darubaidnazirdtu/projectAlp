import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // -------------------------------------------------------------------------
    // Core Identity
    // -------------------------------------------------------------------------
    user_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        // This links to the 'faculty_id' in Faculty model
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    name: {
        type: String,
        required: false,
        trim: true
    },

    designation: {
        type: String,
        required: false,
        trim: true
    },

    password_hash: {
        type: String,
        required: true
    },

    // -------------------------------------------------------------------------
    // Roles & Permissions
    // -------------------------------------------------------------------------
    role: {
        type: String,
        required: true,
        enum: [
            'IQAC Head',
            'Department HOD',
            'Faculty Member'
        ],
        default: 'Faculty Member'
    },

    apar_role: {
        type: String,
        enum: [
            'Officer (Graded)',
            'Reviewing Officer',
            'Reporting Officer'
        ],
        required: false // Not everyone might have an APAR role assigned yet
    },

    reporting_officer_id: {
        type: String,
        required: false,
        trim: true,
        // Links to user_id of the assigned Reporting Officer
    },

    reviewing_officer_id: {
        type: String,
        required: false,
        trim: true,
        // Links to user_id of the assigned Reviewing Officer
    },

    department_id: {
        type: String,
        required: false, // IQAC Head might not have a dept
        trim: true
    },

    // -------------------------------------------------------------------------
    // Session Management
    // -------------------------------------------------------------------------
    session_token: {
        type: String,
        default: null
    },

    session_expires_at: {
        type: Date,
        default: null
    },

    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    created_at: {
        type: Date,
        default: Date.now
    },

    updated_at: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users'
});

// Indexes for fast lookups
// Note: email and user_id already have unique+index in schema definition
UserSchema.index({ session_token: 1 });

export const User = mongoose.model('User', UserSchema);
