import mongoose from 'mongoose';

/**
 * Programme Model
 * Supports: programmes, programmes_with_field_research (tableConfig.js)
 * Uses 'type' discriminator: 'standard' | 'field_research'
 */
const ProgrammeSchema = new mongoose.Schema({
    programme_id: {
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
        enum: ['standard', 'field_research'],
        default: 'standard',
        index: true
    },

    // Common fields
    programme_name: { type: String, required: true },
    programme_code: String,
    level: String, // UG/PG/PhD - required for standard, optional for field_research
    duration_years: Number, // required for standard, optional for field_research
    intake_capacity: Number,
    academic_year: String,

    // Field research specific (type: 'field_research')
    has_field_research_component: Boolean,
    component_name: String,
    course_code_of_component: String,
    number_of_students_undertaking: Number,
    link: String,

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
    collection: 'programmes'
});

// Compound indexes for type-based queries
ProgrammeSchema.index({ type: 1, department_id: 1 });

export const Programme = mongoose.model('Programme', ProgrammeSchema);
