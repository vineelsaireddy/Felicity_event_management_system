import ForumMessage from '../models/ForumMessage.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';
import { createAnnouncementNotifications } from './notificationController.js';

// Helper: check if user is registered for this event
const isParticipantRegistered = async (eventId, userId) => {
    const reg = await Registration.findOne({ eventId, participantId: userId });
    if (reg) return true;
    // Also check teams (hackathon)
    const team = await Team.findOne({ eventId, 'members.memberId': userId });
    return !!team;
};

// GET /api/forum/:eventId — Get all messages for an event
export const getForumMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { since } = req.query; // for polling: ?since=<ISO timestamp>

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const query = { eventId, isDeleted: false };
        if (since) query.updatedAt = { $gt: new Date(since) };

        const messages = await ForumMessage.find(query)
            .sort({ isPinned: -1, createdAt: 1 })
            .lean();

        res.json({ messages, serverTime: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching forum messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// POST /api/forum/:eventId — Post a new message
export const postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, type = 'message', parentId } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!content?.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Permission checks
        if (userRole === 'participant') {
            const registered = await isParticipantRegistered(eventId, userId);
            if (!registered) {
                return res.status(403).json({ message: 'You must be registered for this event to post' });
            }
            // Participants cannot post announcements
            if (type === 'announcement') {
                return res.status(403).json({ message: 'Only organizers can post announcements' });
            }
        } else if (userRole === 'organizer') {
            // Organizer must own this event
            if (event.organizerId.toString() !== userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const message = new ForumMessage({
            eventId,
            authorId: userId,
            authorRole: userRole,
            authorName: req.user.name || req.user.firstName || req.user.email,
            content: content.trim(),
            type,
            parentId: parentId || null,
        });

        await message.save();

        // If this is an announcement, create notifications for all registered participants
        if (type === 'announcement') {
            const senderName = req.user.name || req.user.firstName || req.user.email;
            await createAnnouncementNotifications(
                eventId.toString(),
                message._id.toString(),
                senderName,
                content.trim()
            );
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).json({ message: 'Error posting message', error: error.message });
    }
};

// DELETE /api/forum/:eventId/messages/:messageId — Delete message (organizer can delete any; user can delete own)
export const deleteMessage = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const message = await ForumMessage.findOne({ _id: messageId, eventId });
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Organizer can delete any message in their event
        if (userRole === 'organizer') {
            const event = await Event.findById(eventId);
            if (event?.organizerId.toString() !== userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
        } else {
            // Participant can only delete their own messages
            if (message.authorId.toString() !== userId) {
                return res.status(403).json({ message: 'You can only delete your own messages' });
            }
        }

        message.isDeleted = true;
        message.content = '[Message deleted]';
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};

// PATCH /api/forum/:eventId/messages/:messageId/pin — Pin/unpin (organizer only)
export const togglePin = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const userId = req.user.id;

        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can pin messages' });
        }

        const event = await Event.findById(eventId);
        if (!event || event.organizerId.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const message = await ForumMessage.findOne({ _id: messageId, eventId });
        if (!message) return res.status(404).json({ message: 'Message not found' });

        message.isPinned = !message.isPinned;
        await message.save();

        res.json({ isPinned: message.isPinned, message: `Message ${message.isPinned ? 'pinned' : 'unpinned'}` });
    } catch (error) {
        console.error('Error toggling pin:', error);
        res.status(500).json({ message: 'Error toggling pin', error: error.message });
    }
};

// POST /api/forum/:eventId/messages/:messageId/react — Add/toggle reaction
export const reactToMessage = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!emoji) return res.status(400).json({ message: 'Emoji is required' });

        const message = await ForumMessage.findOne({ _id: messageId, eventId, isDeleted: false });
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const existingIdx = message.reactions.findIndex(
            (r) => r.userId.toString() === userId && r.emoji === emoji
        );

        if (existingIdx !== -1) {
            // Toggle off
            message.reactions.splice(existingIdx, 1);
        } else {
            message.reactions.push({ userId, userRole, emoji });
        }

        await message.save();
        res.json({ reactions: message.reactions });
    } catch (error) {
        console.error('Error reacting to message:', error);
        res.status(500).json({ message: 'Error reacting', error: error.message });
    }
};
