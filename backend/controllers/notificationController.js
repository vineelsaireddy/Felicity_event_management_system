import Notification from '../models/Notification.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';

// Get all notifications for the logged-in participant
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly } = req.query;

        const query = { recipientId: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .populate('eventId', 'name')
            .lean();

        const unreadCount = await Notification.countDocuments({ 
            recipientId: userId, 
            isRead: false 
        });

        res.json({ 
            notifications, 
            unreadCount 
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipientId: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipientId: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
};

// Create notifications for announcement (called by forum controller)
export const createAnnouncementNotifications = async (eventId, forumMessageId, senderName, messageContent) => {
    try {
        // Get all participants registered for this event
        const registrations = await Registration.find({ eventId }).select('participantId');
        const participantIds = registrations.map(reg => reg.participantId);

        // Also get all team members from hackathon teams
        const teams = await Team.find({ eventId }).select('members.memberId');
        teams.forEach(team => {
            team.members.forEach(member => {
                if (!participantIds.includes(member.memberId)) {
                    participantIds.push(member.memberId);
                }
            });
        });

        if (participantIds.length === 0) {
            console.log('No participants registered for this event');
            return;
        }

        // Get event details
        const event = await Event.findById(eventId).select('name');

        // Create notifications for each participant
        const notifications = participantIds.map(participantId => ({
            recipientId: participantId,
            eventId,
            forumMessageId,
            type: 'announcement',
            title: `New Announcement in ${event.name}`,
            message: messageContent.substring(0, 150) + (messageContent.length > 150 ? '...' : ''),
            senderName,
            isRead: false
        }));

        await Notification.insertMany(notifications);
        console.log(`✅ Created ${notifications.length} notifications for announcement`);

    } catch (error) {
        console.error('Error creating announcement notifications:', error);
    }
};
