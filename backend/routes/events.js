import express from 'express';
import {
  getAllEvents,
  getEventDetails,
  registerForEvent,
  getMyEvents,
} from '../controllers/eventController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventDetails);
router.post('/:id/register', authMiddleware, roleMiddleware(['participant']), registerForEvent);
router.get('/participant/my-events', authMiddleware, roleMiddleware(['participant']), getMyEvents);

export default router;
