import { Notification } from '../models/notification.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { getIO } from '../config/socket.js';
import { User } from '../models/user.model.js';
import { Faculty } from '../models/faculty.model.js';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Create and send a notification
 */
export const createNotification = async ({ recipient, sender, type, title, message, link, metadata }) => {
    try {
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            link,
            metadata
        });

        const io = getIO();

        // Target specific user or roles
        // If recipient is a role, we'd need to find users with that role
        // For now, assume recipient is faculty_id/userId

        const roomName = `user-${recipient}`;
        io.to(roomName).emit('notification', notification);

        // Also emit to specific roles if needed
        if (recipient === 'IQAC_HEAD' || recipient === 'HOD') {
            io.to(recipient).emit('notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('[Notification] Error creating notification:', error.message);
        // Don't throw error to avoid breaking the main flow
    }
};

/**
 * Specialized: Notify HOD and IQAC Head
 */
export const notifyHeads = async ({ sender, type, title, message, link, department_id }) => {
    // 1. Notify IQAC Heads (could be multiple or a role group)
    await createNotification({
        recipient: 'IQAC_HEAD',
        sender,
        type,
        title,
        message,
        link
    });

    // 2. Find HOD of the department
    try {
        const hod = await User.findOne({
            department_id,
            role: 'Department HOD'
        });

        if (hod) {
            await createNotification({
                recipient: hod.user_id,
                sender,
                type,
                title,
                message,
                link
            });
        }
    } catch (err) {
        console.error('[Notification] HOD lookup failed:', err.message);
    }
};

export const getMyNotifications = asyncHandler(async (req, res) => {
    const orConditions = buildNotificationRecipientConditions(req.user);

    if (orConditions.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'No recipients found for user'));
    }

    const notifications = await Notification.find({
        $or: orConditions
    }).sort({ createdAt: -1 }).limit(500);

    // Increased limit to 500 to show complete notification history

    return res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
});

const buildNotificationRecipients = (user = {}) => {
    const recipients = [];
    if (user?.userId) recipients.push(user.userId);
    if (user?.faculty_id) recipients.push(user.faculty_id);
    if (user?.id) recipients.push(user.id);

    // Normalize role for robust matching
    const normalizedRole = user.role ? user.role.toLowerCase() : '';

    if (normalizedRole.includes('iqac')) {
        recipients.push('IQAC_HEAD');
        recipients.push('IQAC'); // just in case
    }
    if (normalizedRole.includes('hod')) {
        recipients.push('HOD');
        if (user?.departmentId) recipients.push(`HOD_${user.departmentId}`); // Potential pattern
    }

    // Deduplicate recipients
    return [...new Set(recipients.filter(Boolean))];
};

const buildNotificationRecipientConditions = (user = {}) => {
    const recipients = buildNotificationRecipients(user);

    // Construct flexible query for case-insensitive ID matching
    // and simplified exact matching for roles
    return recipients.map(r => {
        // If it looks like a role (no digits, just letters/underscores), exact match might be safer
        // but IDs like "FACPAWAN" need case insensitivity.
        return { recipient: { $regex: new RegExp(`^${escapeRegex(r)}$`, 'i') } };
    });
};

const ensureNotificationAccess = async (user, notificationId) => {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    const recipients = buildNotificationRecipients(user).map((recipient) => String(recipient).toLowerCase());
    if (!recipients.includes(String(notification.recipient || '').toLowerCase())) {
        throw new ApiError(403, 'You do not have permission to modify this notification');
    }

    return notification;
};

export const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await ensureNotificationAccess(req.user, notificationId);
    notification.isRead = true;
    await notification.save();

    return res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    const orConditions = buildNotificationRecipientConditions(req.user);
    if (orConditions.length === 0) {
        return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
    }

    await Notification.updateMany(
        { $or: orConditions, isRead: false },
        { isRead: true }
    );

    return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await ensureNotificationAccess(req.user, notificationId);
    await Notification.deleteOne({ _id: notification._id });

    return res.status(200).json(new ApiResponse(200, { notificationId }, 'Notification deleted'));
});

export const clearMyNotifications = asyncHandler(async (req, res) => {
    const orConditions = buildNotificationRecipientConditions(req.user);
    if (orConditions.length === 0) {
        return res.status(200).json(new ApiResponse(200, { deletedCount: 0 }, 'Notifications cleared'));
    }

    const result = await Notification.deleteMany({ $or: orConditions });
    return res.status(200).json(new ApiResponse(200, { deletedCount: result.deletedCount || 0 }, 'Notifications cleared'));
});
