import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
    {
        recipientId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Participant',
            required: true,
            index: true
        },
        eventId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Event',
            required: true
        },
        forumMessageId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'ForumMessage',
            required: true
        },
        type: {
            type: String,
            enum: ['announcement', 'forum_message'],
            default: 'announcement'
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        senderName: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for efficient querying
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
