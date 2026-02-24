import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Participant from '../models/Participant.js';
import Team from '../models/Team.js';
import { generateTicketId } from '../utils/auth.js';
import { generateQRCode } from '../utils/qrcode.js';
import { sendRegistrationEmail } from '../utils/email.js';

// Get all events with search and filters
export const getAllEvents = async (req, res) => {
  try {
    const { search, type, eligibility, dateFrom, dateTo, following } = req.query;
    const userId = req.user?.id;

    let filter = { status: { $in: ['Published', 'Ongoing'] } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) filter.type = type;
    if (eligibility) filter.eligibility = eligibility;

    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo) filter.startDate.$lte = new Date(dateTo);
    }

    let events = await Event.find(filter)
      .populate('organizerId', 'name category description')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Get event details
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizerId');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer of this event
    const userId = req.user?.id;
    const isOrganizer = event.organizerId?._id?.toString() === userId;

    // If not organizer and event is Draft, don't show it to participants
    if (!isOrganizer && event.status === 'Draft') {
      return res.status(404).json({ message: 'Event not found' });
    }

    // For hackathon events, get team count
    if (event.type === 'Hackathon') {
      const teamCount = await Team.countDocuments({ eventId: event._id });
      const eventData = event.toObject();
      eventData.analytics.hackathoTeamCount = teamCount;
      return res.json(eventData);
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const participantId = req.user.id;
    const { formData } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check registration deadline
    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline passed' });
    }

    // Check registration limit
    if (event.participants.length >= event.registrationLimit) {
      return res.status(400).json({ message: 'Registration limit reached' });
    }

    // Check if already registered
    const alreadyRegistered = event.participants.find(
      (p) => p.participantId.toString() === participantId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const ticketId = generateTicketId();
    const qrCode = await generateQRCode({ ticketId, eventId, participantId });

    // Add to event participants
    event.participants.push({
      participantId,
      ticketId,
      status: 'Registered',
    });
    event.analytics.totalRegistrations += 1;
    await event.save();

    // Create registration record
    const registration = new Registration({
      participantId,
      eventId,
      ticketId,
      qrCode,
      formData,
      status: 'Active',
    });
    await registration.save();

    // Add to participant's registered events
    await Participant.findByIdAndUpdate(participantId, {
      $push: { registeredEvents: eventId },
    });

    // Send email
    const participant = await Participant.findById(participantId);
    await sendRegistrationEmail(participant.email, event.name, ticketId);

    res.json({
      message: 'Registered successfully',
      ticketId,
      qrCode,
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Error registering for event', error: error.message });
  }
};

// Get participant's registered events (all types: Normal, Merchandise, Hackathon)
export const getMyEvents = async (req, res) => {
  try {
    const participantId = req.user.id;

    // 1. Get all normal/merchandise registrations from Registration model
    const registrations = await Registration.find({ participantId })
      .populate('eventId')
      .sort({ registrationDate: -1 });

    const registrationEventIds = new Set();
    const events = [];

    for (const reg of registrations) {
      if (!reg.eventId) continue; // skip if event was deleted
      registrationEventIds.add(reg.eventId._id.toString());
      events.push({
        ...reg.eventId.toObject(),
        ticketId: reg.ticketId,
        qrCode: reg.qrCode,
        status: reg.status,
        registrationDate: reg.registrationDate,
      });
    }

    // 2. Get hackathon registrations from Team model (members who registered via team)
    const teams = await Team.find({ 'members.memberId': participantId })
      .populate('eventId');

    for (const team of teams) {
      if (!team.eventId) continue;
      const eventIdStr = team.eventId._id.toString();
      // Avoid duplicates if somehow also in Registration
      if (registrationEventIds.has(eventIdStr)) continue;

      // Get team member details
      const teamMembers = await Team.findById(team._id)
        .populate('members.memberId', 'firstName lastName email');

      const myMembership = team.members.find(m => m.memberId?._id?.toString() === participantId || m.memberId?.toString() === participantId);

      events.push({
        ...team.eventId.toObject(),
        ticketId: team.teamTicketId || team.inviteCode || team._id.toString(),
        status: team.registrationStatus === 'Complete' ? 'Registered' : team.registrationStatus || 'Registered',
        registrationDate: myMembership?.joinedDate || team.registrationDate || team.createdAt,
        teamName: team.teamName,
        teamMembers: (teamMembers?.members || []).map(m => ({
          email: m.memberId?.email || m.email,
          name: m.memberId ? `${m.memberId.firstName} ${m.memberId.lastName}` : 'Unknown',
        })),
      });
    }

    // Sort combined results by registrationDate descending
    events.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

    res.json(events);
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Error fetching registered events', error: error.message });
  }
};
