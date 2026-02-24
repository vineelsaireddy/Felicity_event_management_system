import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comments: {
      type: String,
      required: false,
      default: '',
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound index to prevent duplicate feedback from same participant for same event
FeedbackSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

export default mongoose.model('Feedback', FeedbackSchema);
