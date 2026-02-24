import express from 'express';
import {
  createOrganizer,
  getAllOrganizers,
  getArchivedOrganizers,
  removeOrganizer,
  archiveOrganizer,
  unarchiveOrganizer,
  getDashboardStats,
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/organizers',
  authMiddleware,
  roleMiddleware(['admin']),
  createOrganizer
);
router.get(
  '/organizers',
  authMiddleware,
  roleMiddleware(['admin']),
  getAllOrganizers
);
router.get(
  '/organizers/archived/list',
  authMiddleware,
  roleMiddleware(['admin']),
  getArchivedOrganizers
);
router.delete(
  '/organizers/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  removeOrganizer
);
router.patch(
  '/organizers/:id/archive',
  authMiddleware,
  roleMiddleware(['admin']),
  archiveOrganizer
);
router.patch(
  '/organizers/:id/unarchive',
  authMiddleware,
  roleMiddleware(['admin']),
  unarchiveOrganizer
);
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware(['admin']),
  getDashboardStats
);

export default router;
