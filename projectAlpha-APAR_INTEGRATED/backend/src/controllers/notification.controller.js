import { Notification } from '../models/notification.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { getIO } from '../config/socket.js';
import { User } from '../models/user.model.js';
import { Faculty } from '../models/faculty.model.js';

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
    const userId = req.user?.userId || req.user?.faculty_id || req.user?.id;
    const role = req.user?.role;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    // Determine all recipients this user belongs to
    // We include both userId/faculty_id AND the internal Mongo _id to cover all bases
    const recipients = [];
    if (req.user?.userId) recipients.push(req.user.userId);
    if (req.user?.faculty_id) recipients.push(req.user.faculty_id);
    if (req.user?.id) recipients.push(req.user.id);

    // Normalize role for robust matching
    const normalizedRole = role ? role.toLowerCase() : '';

    if (normalizedRole.includes('iqac')) {
        recipients.push('IQAC_HEAD');
        recipients.push('IQAC'); // just in case
    }
    if (normalizedRole.includes('hod')) {
        recipients.push('HOD');
        if (req.user?.departmentId) recipients.push(`HOD_${req.user.departmentId}`); // Potential pattern
    }

    // Deduplicate recipients
    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    // Construct flexible query for case-insensitive ID matching
    // and simplified exact matching for roles
    const orConditions = uniqueRecipients.map(r => {
        // If it looks like a role (no digits, just letters/underscores), exact match might be safer
        // but IDs like "FAC_PAWAN" need case insensitivity.
        return { recipient: { $regex: new RegExp(`^${r}$`, 'i') } };
    });

    // Add exact matches for roles if they're not covered well by regex or just to be safe/fast
    if (orConditions.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'No recipients found for user'));
    }

    const notifications = await Notification.find({
        $or: orConditions
    }).sort({ createdAt: -1 }).limit(500);

    console.log(`[Notification] Found ${notifications.length} notifications.`);
    // Increased limit to 500 to show complete notification history

    return res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
});

export const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    return res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || req.user?.faculty_id || req.user?.id;
    const role = req.user?.role;

    const recipients = [userId];
    const normalizedRole = role ? role.toLowerCase() : '';

    if (normalizedRole.includes('iqac')) {
        recipients.push('IQAC_HEAD');
    }
    if (normalizedRole.includes('hod')) {
        recipients.push('HOD');
    }

    await Notification.updateMany(
        { recipient: { $in: recipients }, isRead: false },
        { isRead: true }
    );

    return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});
