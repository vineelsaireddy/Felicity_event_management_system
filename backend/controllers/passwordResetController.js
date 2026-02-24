import PasswordReset from '../models/PasswordReset.js';
import Participant from '../models/Participant.js';
import Organizer from '../models/Organizer.js';
import Admin from '../models/Admin.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email, role, reason } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Verify user exists
    let user;
    if (role === 'participant') {
      user = await Participant.findOne({ email });
    } else if (role === 'organizer') {
      user = await Organizer.findOne({ loginEmail: email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordReset.findOne({
      userEmail: email,
      userRole: role,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'A password reset request is already pending. Please wait for admin approval.',
      });
    }

    // Create password reset request
    const resetRequest = new PasswordReset({
      userId: user._id,
      userEmail: email,
      userRole: role,
      requestReason: reason || 'User requested password reset',
    });

    await resetRequest.save();

    // Send notification email to user
    const userEmailSubject = 'Password Reset Request Received';
    const userEmailHtml = `
      <h2>Password Reset Request Received</h2>
      <p>Dear User,</p>
      <p>We have received your password reset request. An administrator will review your request shortly.</p>
      <p><strong>Request ID:</strong> ${resetRequest._id}</p>
      <p>You will receive a temporary password once your request is approved.</p>
      <p>Best regards,<br>Felicity Team</p>
    `;
    await sendEmail(email, userEmailSubject, userEmailHtml);

    // Send notification email to admin
    const adminEmailSubject = `Password Reset Request - ${email}`;
    const adminEmailHtml = `
      <h2>New Password Reset Request</h2>
      <p><strong>User Email:</strong> ${email}</p>
      <p><strong>User Role:</strong> ${role}</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/password-reset-requests">View in Admin Panel</a></p>
    `;

    // Send to all admins
    const admins = await Admin.find();
    for (const admin of admins) {
      await sendEmail(admin.email, adminEmailSubject, adminEmailHtml);
    }

    res.json({
      message: 'Password reset request submitted successfully. Please wait for admin approval.',
      requestId: resetRequest._id,
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Error requesting password reset', error: error.message });
  }
};

// Get all pending password reset requests (Admin only)
export const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordReset.find({ status: 'Pending' })
      .sort({ requestDate: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Get ALL password reset requests (history) — Admin only
export const getPasswordResetHistory = async (req, res) => {
  try {
    const requests = await PasswordReset.find({})
      .sort({ requestDate: -1 })
      .limit(100);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching password reset history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

// Get organizer's own reset requests
export const getMyResetRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find organizer to get their email
    const organizer = await Organizer.findById(userId);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    const requests = await PasswordReset.find({ userEmail: organizer.loginEmail })
      .sort({ requestDate: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching my reset requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Approve password reset request (Admin only)
export const approvePasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;

    const resetRequest = await PasswordReset.findById(requestId);

    if (!resetRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Update the user's password in their account
    let user;
    const userRole = resetRequest.userRole;
    const userEmail = resetRequest.userEmail;

    if (userRole === 'participant') {
      user = await Participant.findById(resetRequest.userId);
    } else if (userRole === 'organizer') {
      user = await Organizer.findById(resetRequest.userId);
    } else if (userRole === 'admin') {
      user = await Admin.findById(resetRequest.userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the new password (will be hashed by the pre-save hook)
    user.password = temporaryPassword;
    await user.save();

    // Update reset request
    resetRequest.status = 'Approved';
    resetRequest.temporaryPassword = temporaryPassword;
    resetRequest.approvedBy = adminId;
    resetRequest.approvalDate = new Date();
    await resetRequest.save();

    // Send email to user with temporary password
    const emailSubject = 'Your Password Reset Approved - Temporary Password';
    const emailHtml = `
      <h2>Password Reset Request Approved</h2>
      <p>Dear User,</p>
      <p>Your password reset request has been approved by an administrator.</p>
      <p><strong>Your Temporary Password:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; font-weight: bold;">
        ${temporaryPassword}
      </div>
      <p><strong>Important:</strong> Please keep this password safe and change it immediately after logging in.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Login
        </a>
      </p>
      <p style="margin-top: 20px; color: #666;">
        <strong>Login Details:</strong><br>
        Email: ${userEmail}<br>
        Role: ${userRole}<br>
        Temporary Password: ${temporaryPassword}
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        Do not share this password with anyone. If you didn't request this reset, please contact support immediately.
      </p>
    `;

    await sendEmail(userEmail, emailSubject, emailHtml);

    res.json({
      message: 'Password reset approved and temporary password sent to user',
      requestId: resetRequest._id,
      temporaryPassword: temporaryPassword, // Show to admin for reference
    });
  } catch (error) {
    console.error('Error approving password reset:', error);
    res.status(500).json({ message: 'Error approving request', error: error.message });
  }
};

// Reject password reset request (Admin only)
export const rejectPasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const resetRequest = await PasswordReset.findById(requestId);

    if (!resetRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Update reset request
    resetRequest.status = 'Rejected';
    resetRequest.rejectionReason = reason || 'No reason provided';
    await resetRequest.save();

    // Send email to user
    const userEmail = resetRequest.userEmail;
    const emailSubject = 'Password Reset Request - Rejected';
    const emailHtml = `
      <h2>Password Reset Request Rejected</h2>
      <p>Dear User,</p>
      <p>Your password reset request has been rejected.</p>
      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
      <p>If you believe this is an error, please contact support.</p>
      <p>Best regards,<br>Felicity Team</p>
    `;

    await sendEmail(userEmail, emailSubject, emailHtml);

    res.json({
      message: 'Password reset request rejected',
      requestId: resetRequest._id,
    });
  } catch (error) {
    console.error('Error rejecting password reset:', error);
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
};
