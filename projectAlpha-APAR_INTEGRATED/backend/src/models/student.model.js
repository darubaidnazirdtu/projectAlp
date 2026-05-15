import mongoose from 'mongoose';

/**
 * Student Model
 * Supports: students (tableConfig.js)
 */
const StudentSchema = new mongoose.Schema({
    student_id: {
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
    programme_id: { type: String, required: true },
    enrollment_no: { type: String, required: true, index: true },
    name: { type: String, required: true },
    gender: String,
    date_of_birth: Date,
    email: { type: String, required: true },
    phone: String,
    year_of_admission: { type: Number, required: true },
    current_semester: Number,

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
    collection: 'students'
});

StudentSchema.index({ department_id: 1, programme_id: 1 });

export const Student = mongoose.model('Student', StudentSchema);
