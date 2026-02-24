import Participant from '../models/Participant.js';

// Update participant profile
export const updateProfile = async (req, res) => {
  try {
    const participantId = req.user.id;
    const { firstName, lastName, contactNumber, collegeOrgName, areasOfInterest, followedClubs } = req.body;

    const participant = await Participant.findByIdAndUpdate(
      participantId,
      {
        firstName,
        lastName,
        contactNumber,
        collegeOrgName,
        areasOfInterest,
        followedClubs,
        profileCompleted: true,
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: participant,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get participant profile
export const getProfile = async (req, res) => {
  try {
    const participantId = req.user.id;
    const participant = await Participant.findById(participantId)
      .select('-password')
      .populate('followedClubs');

    res.json(participant);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const participantId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const participant = await Participant.findById(participantId);
    const isPasswordValid = await participant.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    participant.password = newPassword;
    await participant.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};
