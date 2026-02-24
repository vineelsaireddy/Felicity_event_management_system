import express from 'express';
import {
  participantSignup,
  participantLogin,
  adminLogin,
  organizerLogin,
  getCurrentUser,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/participant/signup', participantSignup);
router.post('/participant/login', participantLogin);
router.post('/organizer/login', organizerLogin);
router.post('/admin/login', adminLogin);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
