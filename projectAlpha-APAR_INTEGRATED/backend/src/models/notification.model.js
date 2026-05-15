import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: String, // user_id / faculty_id or 'ADMIN', 'IQAC_HEAD', 'HOD'
        required: true,
        index: true
    },
    sender: {
        type: String, // who triggered it
        default: 'System'
    },
    type: {
        type: String,
        enum: [
            'APAR_SUBMISSION',
            'APAR_REVIEW_REQUEST',
            'APAR_COMPLETED',
            'IQAC_UPDATE',
            'SYSTEM_ALERT',
            'CROSS_FACULTY_REMOVAL'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String, // link to action (e.g., /apar-form or /apar/reporting)
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for performance on fetching unread notifications
notificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
