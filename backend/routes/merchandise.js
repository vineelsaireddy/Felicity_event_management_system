import express from 'express';
import multer from 'multer';
import {
  placeOrder,
  uploadPaymentProof,
  getPendingOrders,
  getAllOrders,
  approveOrder,
  rejectOrder,
  getMyOrders,
  getOrderDetails,
} from '../controllers/merchandiseController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[\\/\s]+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Participant routes
router.post(
  '/order/place',
  authMiddleware,
  roleMiddleware(['participant']),
  placeOrder
);

router.post(
  '/order/:orderId/payment-proof',
  authMiddleware,
  roleMiddleware(['participant']),
  upload.single('paymentProof'),
  uploadPaymentProof
);

router.get(
  '/orders/my-orders',
  authMiddleware,
  roleMiddleware(['participant']),
  getMyOrders
);

router.get(
  '/order/:orderId',
  authMiddleware,
  getOrderDetails
);

// Organizer routes
router.get(
  '/approval/pending-orders',
  authMiddleware,
  roleMiddleware(['organizer']),
  getPendingOrders
);

router.post(
  '/approval/:orderId/approve',
  authMiddleware,
  roleMiddleware(['organizer']),
  approveOrder
);

router.post(
  '/approval/:orderId/reject',
  authMiddleware,
  roleMiddleware(['organizer']),
  rejectOrder
);

router.get(
  '/approval/all-orders',
  authMiddleware,
  roleMiddleware(['organizer']),
  getAllOrders
);

export default router;
