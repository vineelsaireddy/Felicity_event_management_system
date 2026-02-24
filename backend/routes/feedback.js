import express from 'express';
import {
  submitFeedback,
  getEventFeedback,
  getEventFeedbackByRating,
  getMyFeedback,
  deleteFeedback,
  getEventFeedbackStats,
} from '../controllers/feedbackController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Participant routes
router.post(
  '/:eventId/submit',
  authMiddleware,
  roleMiddleware(['participant']),
  submitFeedback
);

router.get(
  '/:eventId/my-feedback',
  authMiddleware,
  roleMiddleware(['participant']),
  getMyFeedback
);

router.delete(
  '/:feedbackId',
  authMiddleware,
  roleMiddleware(['participant']),
  deleteFeedback
);

// Organizer routes
router.get(
  '/:eventId/view',
  authMiddleware,
  roleMiddleware(['organizer']),
  getEventFeedback
);

router.get(
  '/:eventId/rating/:rating',
  authMiddleware,
  roleMiddleware(['organizer']),
  getEventFeedbackByRating
);

router.get(
  '/:eventId/stats',
  authMiddleware,
  roleMiddleware(['organizer']),
  getEventFeedbackStats
);

export default router;
