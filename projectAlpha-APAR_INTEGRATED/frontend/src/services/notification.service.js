import { Api } from '../api/Api.js';

// Use the shared API wrapper to:
// - respect VITE_BASEURL (the rest of the app uses this)
// - send cookies (withCredentials)
// - unwrap ApiResponse { statusCode, data, message }
class NotificationService {
    constructor() {
        this.api = new Api(import.meta.env.VITE_BASEURL);
    }

    async getNotifications() {
        // backend: GET /api/v1/notifications
        return await this.api.get('/notifications');
    }

    async markAsRead(notificationId) {
        // backend: PATCH /api/v1/notifications/:notificationId/read
        return await this.api.patch(`/notifications/${notificationId}/read`, {});
    }

    async markAllAsRead() {
        // backend: PATCH /api/v1/notifications/read-all
        return await this.api.patch('/notifications/read-all', {});
    }
}

export const notificationService = new NotificationService();
