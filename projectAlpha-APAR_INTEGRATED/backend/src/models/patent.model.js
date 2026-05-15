import mongoose from 'mongoose';

/**
 * Patent Model
 * Supports: patents (tableConfig.js)
 */
const PatentSchema = new mongoose.Schema({
    patent_id: {
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
    patent_title: { type: String, required: true },
    author_names: String,
    application_number: { type: String, required: true },
    patent_number: String,
    status: { type: String, required: true }, // Filed/Published/Granted
    country: String,
    date_of_filing: { type: Date, required: true },
    date_of_award: Date,
    patent_awarding_agency: String,
    link_to_patent: String,
    academic_year: String,

    // Many-to-many relationships
    faculty_members: [{ faculty_id: String }],
    students: [{ student_id: String }],
    external_inventors: [{
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
    collection: 'patents'
});

PatentSchema.index({ department_id: 1, status: 1 });
PatentSchema.index({ 'faculty_members.faculty_id': 1 });

export const Patent = mongoose.model('Patent', PatentSchema);
