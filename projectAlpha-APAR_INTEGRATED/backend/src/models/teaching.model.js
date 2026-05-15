import mongoose from 'mongoose';

/**
 * Teaching Model
 * Supports: student_centric_methods (tableConfig.js)
 */
const TeachingSchema = new mongoose.Schema({
    method_id: {
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
    course_id: { type: String, required: true },
    programme_id: { type: String, required: true },
    faculty_id: { type: String, required: true, index: true },

    method_type: { type: String, required: true }, // Experiential Learning/Participative Learning/Problem Solving/Flipped Classroom/Collaborative Learning/Other
    level: { type: String, required: true }, // UG/PG/PhD
    academic_year: { type: String, required: true },
    semester: { type: String, required: true },
    details_of_methods: { type: String, required: true },
    course_name: { type: String, required: true },
    course_code: String,
    programme_name: { type: String, required: true },
    assessment_method: String,
    outcome: String,
    remarks: String,
    evidence_link: String,

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
    collection: 'teaching_methods'
});

TeachingSchema.index({ department_id: 1, academic_year: 1 });
TeachingSchema.index({ faculty_id: 1, course_id: 1 });

export const Teaching = mongoose.model('Teaching', TeachingSchema);
