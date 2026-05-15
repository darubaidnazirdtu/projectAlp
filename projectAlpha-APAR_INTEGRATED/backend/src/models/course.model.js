import mongoose from 'mongoose';

/**
 * Course Model
 * Supports: courses (tableConfig.js)
 */
const CourseSchema = new mongoose.Schema({
    course_id: {
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
    programme_id: String,
    course_name: { type: String, required: true },
    course_code: { type: String, required: true },
    credits: { type: Number, required: true },
    semester_offered: { type: Number, required: true },
    type: { type: String, required: true },
    year_of_introduction: { type: Number, required: true },
    focus_on_employability: Boolean,
    focus_on_entrepreneurship: Boolean,
    focus_on_skill_development: Boolean,

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
    collection: 'courses'
});

CourseSchema.index({ department_id: 1, programme_id: 1 });

export const Course = mongoose.model('Course', CourseSchema);
