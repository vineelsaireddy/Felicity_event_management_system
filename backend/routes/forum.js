import express from 'express';
import {
    getForumMessages,
    postMessage,
    deleteMessage,
    togglePin,
    reactToMessage,
} from '../controllers/forumController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all messages for event (participants + organizers)
router.get(
    '/:eventId',
    authMiddleware,
    roleMiddleware(['participant', 'organizer']),
    getForumMessages
);

// Post a new message
router.post(
    '/:eventId',
    authMiddleware,
    roleMiddleware(['participant', 'organizer']),
    postMessage
);

// Delete a message (organizer can delete any, participant own only)
router.delete(
    '/:eventId/messages/:messageId',
    authMiddleware,
    roleMiddleware(['participant', 'organizer']),
    deleteMessage
);

// Pin / unpin (organizer only)
router.patch(
    '/:eventId/messages/:messageId/pin',
    authMiddleware,
    roleMiddleware(['organizer']),
    togglePin
);

// React to a message
router.post(
    '/:eventId/messages/:messageId/react',
    authMiddleware,
    roleMiddleware(['participant', 'organizer']),
    reactToMessage
);

export default router;
