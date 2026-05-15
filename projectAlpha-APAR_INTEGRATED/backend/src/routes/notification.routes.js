import { Router } from 'express';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
