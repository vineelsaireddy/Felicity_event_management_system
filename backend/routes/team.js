import express from 'express';
import {
  createTeam,
  getTeamDetails,
  joinTeam,
  completeTeamRegistration,
  getTeamDashboard,
  removeTeamMember,
  deleteTeam,
} from '../controllers/teamController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Participant routes
router.post(
  '/create',
  authMiddleware,
  roleMiddleware(['participant']),
  createTeam
);

router.post(
  '/join',
  authMiddleware,
  roleMiddleware(['participant']),
  joinTeam
);

// Dashboard route MUST come before /:teamId to avoid treating 'dashboard' as teamId
router.get(
  '/dashboard/my-teams',
  authMiddleware,
  roleMiddleware(['participant']),
  getTeamDashboard
);

router.get(
  '/:teamId',
  authMiddleware,
  roleMiddleware(['participant']),
  getTeamDetails
);

router.post(
  '/:teamId/complete-registration',
  authMiddleware,
  roleMiddleware(['participant']),
  completeTeamRegistration
);

router.delete(
  '/:teamId/members/:memberId',
  authMiddleware,
  roleMiddleware(['participant']),
  removeTeamMember
);

router.delete(
  '/:teamId',
  authMiddleware,
  roleMiddleware(['participant']),
  deleteTeam
);

export default router;
