import express from 'express';
import {
  requestPasswordReset,
  getPasswordResetRequests,
  getPasswordResetHistory,
  getMyResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
} from '../controllers/passwordResetController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public route - any user can request password reset
router.post('/request', requestPasswordReset);

// Organizer: view their own password reset request history
router.get(
  '/my-requests',
  authMiddleware,
  roleMiddleware(['organizer']),
  getMyResetRequests
);

// Admin only routes
router.get(
  '/requests',
  authMiddleware,
  roleMiddleware(['admin']),
  getPasswordResetRequests
);

// Admin: full history (all statuses)
router.get(
  '/history',
  authMiddleware,
  roleMiddleware(['admin']),
  getPasswordResetHistory
);

router.post(
  '/requests/:requestId/approve',
  authMiddleware,
  roleMiddleware(['admin']),
  approvePasswordReset
);

router.post(
  '/requests/:requestId/reject',
  authMiddleware,
  roleMiddleware(['admin']),
  rejectPasswordReset
);

export default router;
