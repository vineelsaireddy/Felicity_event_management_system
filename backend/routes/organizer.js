import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createEvent,
  getOrganizerEvents,
  getOrganizerEventDetails,
  publishEvent,
  updateEvent,
  updateEventStatus,
  updateOrganizerProfile,
  markAttendance,
  scanTicket,
  updateCustomForm,
  updateMerchandiseItems,
  getAllOrganizers,
} from '../controllers/organizerController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

// Multer storage for merchandise item images
const merchandiseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/merchandise-images/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
const uploadMerchandise = multer({
  storage: merchandiseStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});


const router = express.Router();

// Public route - get all approved organizers (no auth required for participants to browse)
router.get('/all', getAllOrganizers);

router.post(
  '/events',
  authMiddleware,
  roleMiddleware(['organizer']),
  createEvent
);
router.get(
  '/events',
  authMiddleware,
  roleMiddleware(['organizer']),
  getOrganizerEvents
);
router.get(
  '/events/:id',
  authMiddleware,
  roleMiddleware(['organizer']),
  getOrganizerEventDetails
);
router.post(
  '/events/:id/publish',
  authMiddleware,
  roleMiddleware(['organizer']),
  publishEvent
);
router.put(
  '/events/:id',
  authMiddleware,
  roleMiddleware(['organizer']),
  updateEvent
);
router.patch(
  '/events/:id/status',
  authMiddleware,
  roleMiddleware(['organizer']),
  updateEventStatus
);
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware(['organizer']),
  updateOrganizerProfile
);

// Attendance tracking
router.post(
  '/events/:eventId/attendance/:registrationId',
  authMiddleware,
  roleMiddleware(['organizer']),
  markAttendance
);

// QR ticket scan
router.post(
  '/events/:eventId/scan',
  authMiddleware,
  roleMiddleware(['organizer']),
  scanTicket
);

// Custom form builder
router.put(
  '/events/:id/form',
  authMiddleware,
  roleMiddleware(['organizer']),
  updateCustomForm
);

// Merchandise items management (with image upload)
router.put(
  '/events/:id/merchandise',
  authMiddleware,
  roleMiddleware(['organizer']),
  uploadMerchandise.any(), // accepts image_0, image_1, ...
  updateMerchandiseItems
);

export default router;
