import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications
router.get(
    '/',
    authMiddleware,
    roleMiddleware(['participant']),
    getNotifications
);

// Mark single notification as read
router.patch(
    '/:notificationId/read',
    authMiddleware,
    roleMiddleware(['participant']),
    markAsRead
);

// Mark all notifications as read
router.patch(
    '/read/all',
    authMiddleware,
    roleMiddleware(['participant']),
    markAllAsRead
);

// Delete a notification
router.delete(
    '/:notificationId',
    authMiddleware,
    roleMiddleware(['participant']),
    deleteNotification
);

export default router;
