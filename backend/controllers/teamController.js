import Team from '../models/Team.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import { generateTicketId } from '../utils/auth.js';
import { generateQRCode } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

// Create a team
export const createTeam = async (req, res) => {
  try {
    const { eventId, teamName, teamSize } = req.body;
    const leaderId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if participant already has a team in this event
    const existingTeam = await Team.findOne({
      eventId,
      'members.memberId': leaderId,
    }).populate('leaderId', 'firstName lastName email')
      .populate('members.memberId', 'firstName lastName email');
    
    if (existingTeam) {
      // Return existing team instead of error
      return res.status(200).json({
        message: 'You already have a team in this event',
        data: existingTeam,
        existing: true,
      });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const team = new Team({
      teamName,
      eventId,
      leaderId,
      teamSize,
      inviteCode,
      members: [
        {
          memberId: leaderId,
          email: (await Participant.findById(leaderId)).email,
          invitationStatus: 'Accepted',
          joinedDate: new Date(),
        },
      ],
    });

    await team.save();

    // Add team leader to event registrations to show in "My Events"
    const Registration = require('../models/Registration.js').default;
    const existingReg = await Registration.findOne({
      eventId,
      participantId: leaderId,
    });
    if (!existingReg) {
      const newReg = new Registration({
        eventId,
        participantId: leaderId,
        status: 'Registered',
      });
      await newReg.save();
    }

    // Populate team data before responding
    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'firstName lastName email')
      .populate('members.memberId', 'firstName lastName email');

    res.status(201).json({
      message: 'Team created successfully',
      data: populatedTeam,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

// Get team details
export const getTeamDetails = async (req, res) => {
  try {
    const teamId = req.params.teamId;

    const team = await Team.findById(teamId)
      .populate('leaderId', 'firstName lastName email')
      .populate('members.memberId', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
};

// Join team using invite code
export const joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const participantId = req.user.id;

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if team is full
    if (team.members.length >= team.teamSize) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Check if already a member
    const alreadyMember = team.members.find(
      (m) => m.memberId?.toString() === participantId
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'Already a member of this team' });
    }

    const participant = await Participant.findById(participantId);

    team.members.push({
      memberId: participantId,
      email: participant.email,
      invitationStatus: 'Accepted',
      joinedDate: new Date(),
    });

    await team.save();

    // Add participant to event registrations to show in "My Events"
    const Registration = require('../models/Registration.js').default;
    const existingReg = await Registration.findOne({
      eventId: team.eventId,
      participantId: participantId,
    });
    if (!existingReg) {
      const newReg = new Registration({
        eventId: team.eventId,
        participantId: participantId,
        status: 'Registered',
      });
      await newReg.save();
    }

    // Return full populated team data for immediate display
    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'firstName lastName email')
      .populate('members.memberId', 'firstName lastName email');

    res.json({
      message: 'Joined team successfully - You are now a team member!',
      data: populatedTeam,
    });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ message: 'Error joining team', error: error.message });
  }
};

// Complete team registration (only leader can do this)
export const completeTeamRegistration = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const leaderId = req.user.id;
    const { formData } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify user is team leader
    if (team.leaderId.toString() !== leaderId) {
      return res.status(403).json({ message: 'Only team leader can complete registration' });
    }

    // Check if team is full
    if (team.members.length < team.teamSize) {
      return res.status(400).json({
        message: `Team needs ${team.teamSize - team.members.length} more member(s) to complete registration`,
      });
    }

    const event = await Event.findById(team.eventId);

    // Check registration deadline
    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline passed' });
    }

    // Generate tickets and QR codes for all members
    const ticketIds = [];
    const qrCodes = [];
    const memberDetails = [];

    for (const member of team.members) {
      const ticketId = generateTicketId();
      const qrCode = await generateQRCode({
        ticketId,
        eventId: team.eventId,
        participantId: member.memberId,
        teamId: team._id,
      });

      ticketIds.push(ticketId);
      qrCodes.push(qrCode);
      memberDetails.push({
        participantId: member.memberId,
        email: member.email,
        ticketId,
        qrCode,
      });
    }

    // Create hackathon registration record
    const hackathonRegistration = new HackathonRegistration({
      teamId: team._id,
      eventId: team.eventId,
      leaderId: team.leaderId,
      members: memberDetails,
      registrationStatus: 'Complete',
      formData,
    });

    await hackathonRegistration.save();

    // Update team status
    team.registrationStatus = 'Complete';
    team.ticketIds = ticketIds;
    await team.save();

    // Add all team members to event participants for analytics
    const Registration = require('../models/Registration.js').default;
    for (const member of memberDetails) {
      const existingParticipant = event.participants.find(
        (p) => p.participantId?.toString() === member.participantId.toString()
      );
      if (!existingParticipant) {
        event.participants.push({
          participantId: member.participantId,
          ticketId: member.ticketId,
          teamId: team._id,
          status: 'Registered',
        });
      }
    }
    
    event.analytics.totalRegistrations = event.participants.length;
    event.analytics.hackathoTeamCount = (event.analytics.hackathoTeamCount || 0) + 1;
    await event.save();

    // Send confirmation emails to all members
    const subject = `Team Registration Confirmation for ${event.name}`;
    const html = `
      <h2>Team Registration Complete</h2>
      <p>Your team <strong>${team.teamName}</strong> has been registered for <strong>${event.name}</strong></p>
      <h3>Team Members:</h3>
      <ul>
        ${memberDetails.map((member) => `<li>${member.email} - Ticket: ${member.ticketId}</li>`).join('')}
      </ul>
      <p>All team members have been assigned unique tickets. Keep these safe for attendance.</p>
    `;

    for (const member of memberDetails) {
      await sendEmail(member.email, subject, html);
    }

    res.json({
      message: 'Team registration completed successfully',
      registrationId: hackathonRegistration._id,
      teamName: team.teamName,
      memberCount: team.members.length,
      ticketIds,
    });
  } catch (error) {
    console.error('Error completing team registration:', error);
    res.status(500).json({
      message: 'Error completing team registration',
      error: error.message,
    });
  }
};

// Get team management dashboard (for leader)
export const getTeamDashboard = async (req, res) => {
  try {
    const leaderId = req.user.id;

    const teams = await Team.find({ leaderId })
      .populate('eventId', 'name type status registrationDeadline')
      .populate('members.memberId', 'firstName lastName email');

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const registrations = await HackathonRegistration.findOne({ teamId: team._id });
        return {
          teamId: team._id,
          teamName: team.teamName,
          teamSize: team.teamSize,
          members: team.members.map((m) => ({
            email: m.email,
            status: m.invitationStatus,
            joined: m.joinedDate,
          })),
          registrationStatus: team.registrationStatus,
          event: team.eventId,
          inviteCode: team.inviteCode,
          registeredAt: registrations ? registrations.createdAt : null,
        };
      })
    );

    res.json(teamsWithStats);
  } catch (error) {
    console.error('Error fetching team dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

// Remove member from team (leader only)
export const removeTeamMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const leaderId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leaderId.toString() !== leaderId) {
      return res.status(403).json({ message: 'Only team leader can remove members' });
    }

    // Cannot remove if registration is complete
    if (team.registrationStatus === 'Complete') {
      return res.status(400).json({
        message: 'Cannot remove members after registration is complete',
      });
    }

    team.members = team.members.filter((m) => m.memberId?.toString() !== memberId);
    await team.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

// Delete a team (only leader can do this before registration completes)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const leaderId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leaderId.toString() !== leaderId) {
      return res.status(403).json({ message: 'Only team leader can delete team' });
    }

    // Cannot delete if registration is complete
    if (team.registrationStatus === 'Complete') {
      return res.status(400).json({
        message: 'Cannot delete team after registration is complete',
      });
    }

    await Team.findByIdAndDelete(teamId);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
};
