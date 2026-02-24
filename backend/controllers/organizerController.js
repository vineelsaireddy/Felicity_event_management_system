import Event from '../models/Event.js';
import Organizer from '../models/Organizer.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import { generateTicketId } from '../utils/auth.js';
import { generateQRCode } from '../utils/qrcode.js';

// Get all approved organizers (public endpoint for participants)
export const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find({ isActive: true, isArchived: false })
      .select('-password')
      .lean();

    res.json(organizers);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ message: 'Error fetching organizers', error: error.message });
  }
};

// Create event
export const createEvent = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const {
      name,
      description,
      type,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      customForm,
    } = req.body;

    const event = new Event({
      name,
      description,
      type,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      organizerId,
      tags,
      status: 'Draft',
      customForm: customForm || {
        fields: [],
        isLocked: false,
      },
    });

    await event.save();
    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

// Get organizer's events
export const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

    // For Hackathon events attach live team counts from the Team collection
    // (participants[] is empty for hackathons — teams are stored in Team model)
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject();
        if (event.type === 'Hackathon') {
          const teams = await Team.find({ eventId: event._id });
          eventObj.teamCount = teams.length;
          eventObj.memberCount = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
          eventObj.completedTeamCount = teams.filter(t => t.registrationStatus === 'Complete').length;
        }
        return eventObj;
      })
    );

    res.json(eventsWithCounts);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};


// Get event details for organizer
export const getOrganizerEventDetails = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch standard registrations (Normal / Merchandise events)
    const registrations = await Registration.find({ eventId }).populate('participantId');

    let teams = [];
    let hackathonRegistrations = [];

    // For Hackathon events also fetch team data
    if (event.type === 'Hackathon') {
      teams = await Team.find({ eventId })
        .populate('leaderId', 'firstName lastName email')
        .populate('members.memberId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      hackathonRegistrations = await HackathonRegistration.find({ eventId })
        .populate('leaderId', 'firstName lastName email')
        .populate('members.participantId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    res.json({
      event,
      registrations,
      teams,
      hackathonRegistrations,
      analytics: {
        ...event.analytics.toObject?.() || event.analytics,
        totalTeams: teams.length,
        completedTeams: teams.filter(t => t.registrationStatus === 'Complete').length,
        formingTeams: teams.filter(t => t.registrationStatus === 'Forming').length,
        totalMembers: teams.reduce((sum, t) => sum + (t.members?.length || 0), 0),
      },
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Error fetching event details', error: error.message });
  }
};


// Publish event
export const publishEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'Published';
    await event.save();

    // 🔔 Trigger Discord Webhook if configured
    try {
      const organizer = await Organizer.findById(organizerId);
      if (organizer?.discordWebhook) {
        const webhookPayload = {
          username: 'Felicity Events',
          embeds: [{
            title: `📢 New Event Published: ${event.name}`,
            description: event.description?.slice(0, 300) + (event.description?.length > 300 ? '...' : ''),
            color: 0x3b82f6,
            fields: [
              { name: '🏷️ Type', value: event.type, inline: true },
              { name: '📋 Eligibility', value: event.eligibility, inline: true },
              { name: '💰 Fee', value: event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free', inline: true },
              { name: '📅 Start Date', value: new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), inline: true },
              { name: '⏰ Registration Deadline', value: new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), inline: true },
              { name: '👥 Capacity', value: `${event.registrationLimit} spots`, inline: true },
            ],
            footer: { text: `Organized by ${organizer.name}` },
            timestamp: new Date().toISOString(),
          }],
        };

        await fetch(organizer.discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
      }
    } catch (webhookErr) {
      // Non-fatal: just log — don't fail the publish
      console.warn('Discord webhook failed:', webhookErr.message);
    }

    res.json({
      message: 'Event published successfully',
      event,
    });
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({ message: 'Error publishing event', error: error.message });
  }
};


// Update event
export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);

    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow certain updates based on status
    if (event.status === 'Draft') {
      Object.assign(event, req.body);
    } else if (event.status === 'Published') {
      // Allow description update, deadline extension, limit increase
      if (req.body.description) event.description = req.body.description;
      if (req.body.registrationDeadline) event.registrationDeadline = req.body.registrationDeadline;
      if (req.body.registrationLimit && req.body.registrationLimit >= event.participants.length) {
        event.registrationLimit = req.body.registrationLimit;
      }
    } else {
      return res.status(400).json({ message: 'Cannot update event in this status' });
    }

    await event.save();
    res.json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// Update event status
export const updateEventStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;
    const { status } = req.body;

    const event = await Event.findById(eventId);

    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    event.status = status;
    await event.save();

    res.json({
      message: 'Event status updated successfully',
      event,
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Error updating event status', error: error.message });
  }
};

// Update organizer profile
export const updateOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { name, category, description, contactNumber, discordWebhook } = req.body;

    const organizer = await Organizer.findByIdAndUpdate(
      organizerId,
      { name, category, description, contactNumber, discordWebhook },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      organizer,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Mark / unmark attendance for a registration (Organizer)
export const markAttendance = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { attended, manualOverride, overrideReason } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration || registration.eventId.toString() !== eventId) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'Attended' && !manualOverride) {
      return res.status(400).json({ message: 'Already marked as attended. Use manualOverride to change.' });
    }

    registration.status = attended ? 'Attended' : 'Registered';
    registration.attendedAt = attended ? new Date() : undefined;
    if (manualOverride) {
      registration.manualOverride = true;
      registration.overrideReason = overrideReason || 'Manual override';
    }
    await registration.save();

    // Update analytics
    const attendedCount = await Registration.countDocuments({ eventId, status: 'Attended' });
    await Event.findByIdAndUpdate(eventId, { 'analytics.attendance': attendedCount });

    res.json({ message: `Attendance ${attended ? 'marked' : 'unmarked'}`, registration });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Scan QR ticket and mark attendance
export const scanTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketId } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registration = await Registration.findOne({ eventId, ticketId }).populate('participantId', 'firstName lastName email');
    if (!registration) {
      return res.status(404).json({ message: 'Invalid ticket ID. Ticket not found for this event.' });
    }

    if (registration.status === 'Attended') {
      return res.status(400).json({
        message: 'Duplicate scan! Ticket already scanned.',
        alreadyScanned: true,
        participant: registration.participantId,
        scannedAt: registration.attendedAt,
      });
    }

    registration.status = 'Attended';
    registration.attendedAt = new Date();
    await registration.save();

    const attendedCount = await Registration.countDocuments({ eventId, status: 'Attended' });
    await Event.findByIdAndUpdate(eventId, { 'analytics.attendance': attendedCount });

    res.json({
      message: '✅ Attendance marked successfully',
      participant: registration.participantId,
      ticketId,
      attendedAt: registration.attendedAt,
    });
  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({ message: 'Error scanning ticket', error: error.message });
  }
};

// Get / update custom form fields for an event
export const updateCustomForm = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { fields } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.customForm?.isLocked) {
      return res.status(400).json({ message: 'Form is locked after first registration. No further edits allowed.' });
    }

    if (event.type !== 'Normal') {
      return res.status(400).json({ message: 'Custom forms are only available for Normal events' });
    }

    event.customForm.fields = fields;
    await event.save();
    res.json({ message: 'Custom form updated', customForm: event.customForm });
  } catch (error) {
    console.error('Error updating custom form:', error);
    res.status(500).json({ message: 'Error updating form', error: error.message });
  }
};

// Update merchandise items (organizer) - receives parsed items array + uploaded files
export const updateMerchandiseItems = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.type !== 'Merchandise') {
      return res.status(400).json({ message: 'This route is only for Merchandise events' });
    }

    // items sent as JSON string in form-data field "items"
    let items;
    try {
      items = JSON.parse(req.body.items || '[]');
    } catch {
      return res.status(400).json({ message: 'Invalid items JSON' });
    }

    // Map uploaded files by field name: "image_0", "image_1", ...
    const fileMap = {};
    if (req.files) {
      req.files.forEach(file => {
        fileMap[file.fieldname] = file.path;
      });
    }

    // Merge uploaded images into item objects
    const mergedItems = items.map((item, idx) => {
      const itemId = item.itemId || `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
      const imagePath = fileMap[`image_${idx}`] || item.image || null;
      return {
        itemId,
        name: item.name || '',
        description: item.description || '',
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        size: item.size || '',
        color: item.color || '',
        variants: Array.isArray(item.variants) ? item.variants : (item.variants ? [item.variants] : []),
        image: imagePath,
      };
    });

    event.merchandise = event.merchandise || {};
    event.merchandise.items = mergedItems;
    await event.save();

    res.json({
      message: 'Merchandise items updated successfully',
      items: event.merchandise.items,
    });
  } catch (error) {
    console.error('Error updating merchandise items:', error);
    res.status(500).json({ message: 'Error updating items', error: error.message });
  }
};


