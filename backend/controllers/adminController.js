import Admin from '../models/Admin.js';
import Organizer from '../models/Organizer.js';
import { generateToken } from '../utils/auth.js';

// Create organizer (Admin only)
export const createOrganizer = async (req, res) => {
  try {
    const { name, category, description, contactEmail, contactNumber } = req.body;

    // Generate login credentials
    const loginEmail = `${name.toLowerCase().replace(/\s+/g, '_')}@felicity.com`;
    const loginPassword = Math.random().toString(36).slice(-12);

    const organizer = new Organizer({
      name,
      category,
      description,
      contactEmail,
      contactNumber,
      loginEmail,
      password: loginPassword,
      createdBy: req.user.id,
    });

    await organizer.save();

    res.status(201).json({
      message: 'Organizer created successfully',
      organizer: {
        id: organizer._id,
        name: organizer.name,
        loginEmail: organizer.loginEmail,
        loginPassword, // Share only once
      },
    });
  } catch (error) {
    console.error('Error creating organizer:', error);
    res.status(500).json({ message: 'Error creating organizer', error: error.message });
  }
};

// Get all organizers
export const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find({ isActive: true, isArchived: false }).select(
      '-password'
    );

    res.json(organizers);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ message: 'Error fetching organizers', error: error.message });
  }
};

// Get archived organizers
export const getArchivedOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find({ $or: [{ isArchived: true }, { isActive: false }] }).select(
      '-password'
    );

    res.json(organizers);
  } catch (error) {
    console.error('Error fetching archived organizers:', error);
    res.status(500).json({ message: 'Error fetching archived organizers', error: error.message });
  }
};

// Remove organizer (Permanent deletion)
export const removeOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;

    // Permanently delete the organizer from database
    const deletedOrganizer = await Organizer.findByIdAndDelete(organizerId);

    if (!deletedOrganizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    res.json({
      message: 'Organizer permanently deleted successfully',
      organizer: deletedOrganizer,
    });
  } catch (error) {
    console.error('Error deleting organizer:', error);
    res.status(500).json({ message: 'Error deleting organizer', error: error.message });
  }
};

// Archive organizer
export const archiveOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;

    const organizer = await Organizer.findByIdAndUpdate(
      organizerId,
      { isArchived: true },
      { new: true }
    );

    res.json({
      message: 'Organizer archived successfully',
      organizer,
    });
  } catch (error) {
    console.error('Error archiving organizer:', error);
    res.status(500).json({ message: 'Error archiving organizer', error: error.message });
  }
};

// Unarchive organizer (restore access)
export const unarchiveOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;

    const organizer = await Organizer.findByIdAndUpdate(
      organizerId,
      { isArchived: false, isActive: true },
      { new: true }
    );

    res.json({
      message: 'Organizer restored successfully',
      organizer,
    });
  } catch (error) {
    console.error('Error restoring organizer:', error);
    res.status(500).json({ message: 'Error restoring organizer', error: error.message });
  }
};

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrganizers = await Organizer.countDocuments({ isActive: true, isArchived: false });
    const totalEvents = await Event.countDocuments();

    res.json({
      totalOrganizers,
      totalEvents,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
