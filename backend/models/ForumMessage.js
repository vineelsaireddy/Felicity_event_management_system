import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['participant', 'organizer'], required: true },
    emoji: { type: String, required: true }, // e.g. '👍', '❤️', '🎉'
}, { _id: false });

const ForumMessageSchema = new mongoose.Schema(
    {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
        authorRole: { type: String, enum: ['participant', 'organizer'], required: true },
        authorName: { type: String, required: true },
        content: { type: String, required: true, maxlength: 2000 },
        type: {
            type: String,
            enum: ['message', 'announcement', 'question'],
            default: 'message',
        },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumMessage', default: null }, // threading
        isPinned: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        reactions: [ReactionSchema],
    },
    { timestamps: true }
);

export default mongoose.model('ForumMessage', ForumMessageSchema);
