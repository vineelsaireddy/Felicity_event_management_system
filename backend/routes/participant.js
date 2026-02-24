import express from 'express';
import {
  updateProfile,
  getProfile,
  changePassword,
} from '../controllers/participantController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware(['participant']), getProfile);
router.put('/profile', authMiddleware, roleMiddleware(['participant']), updateProfile);
router.post('/change-password', authMiddleware, roleMiddleware(['participant']), changePassword);

export default router;
