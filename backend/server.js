import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import participantRoutes from './routes/participant.js';
import organizerRoutes from './routes/organizer.js';
import adminRoutes from './routes/admin.js';
import teamRoutes from './routes/team.js';
import merchandiseRoutes from './routes/merchandise.js';
import passwordResetRoutes from './routes/passwordReset.js';
import forumRoutes from './routes/forum.js';
import feedbackRoutes from './routes/feedback.js';
import notificationRoutes from './routes/notification.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables 
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (payment proofs, merchandise images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes [cite: 15]
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Felicity API is running' });
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware [cite: 56]
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to database then start server [cite: 14, 17]
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

startServer();