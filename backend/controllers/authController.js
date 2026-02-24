import Participant from '../models/Participant.js';
import Admin from '../models/Admin.js';
import Organizer from '../models/Organizer.js';
import { generateToken } from '../utils/auth.js';

// Participant Registration
export const participantSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeOrgName, contactNumber } = req.body;

    // Validate IIIT email - must be @students.iiit.ac.in or @research.iiit.ac.in
    if (participantType === 'IIIT') {
      const isValidIIITEmail = email.endsWith('@students.iiit.ac.in') || email.endsWith('@research.iiit.ac.in');
      if (!isValidIIITEmail) {
        return res.status(400).json({ message: 'IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in email domain' });
      }
    }

    // Check if email already exists
    const existingUser = await Participant.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const participant = new Participant({
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeOrgName,
      contactNumber,
    });

    await participant.save();
    const token = generateToken(participant);

    res.status(201).json({
      message: 'Participant registered successfully',
      token,
      user: {
        id: participant._id,
        firstName: participant.firstName,
        email: participant.email,
        role: participant.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error during signup', error: error.message });
  }
};

// Participant Login
export const participantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await participant.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(participant);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: participant._id,
        firstName: participant.firstName,
        email: participant.email,
        role: participant.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(admin);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

// Organizer Login
export const organizerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const organizer = await Organizer.findOne({ loginEmail: email });
    if (!organizer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if organizer account is active and not archived
    if (!organizer.isActive || organizer.isArchived) {
      return res.status(403).json({ message: 'Your account has been disabled or archived. Please contact the administrator.' });
    }

    const isPasswordValid = await organizer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(organizer);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.loginEmail,
        role: organizer.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === 'participant') {
      user = await Participant.findById(userId).select('-password');
    } else if (role === 'organizer') {
      user = await Organizer.findById(userId).select('-password');
    } else if (role === 'admin') {
      user = await Admin.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return a normalized shape that matches the login response.
    // 'id' is always present so user.id works throughout the frontend
    // without needing to check both user.id and user._id.
    res.json({
      id: user._id,
      _id: user._id,
      role,
      email: user.email || user.loginEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      contactNumber: user.contactNumber,
      participantType: user.participantType,
      collegeOrgName: user.collegeOrgName,
      registeredEvents: user.registeredEvents,
      areasOfInterest: user.areasOfInterest,
      followedClubs: user.followedClubs,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

