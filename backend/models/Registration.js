import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema(
  {
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketId: { type: String, unique: true, required: true },
    qrCode: { type: String },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'Registered', 'Attended', 'Cancelled', 'Completed'],
      default: 'Active',
    },
    formData: { type: mongoose.Schema.Types.Mixed },
    teamId: { type: String },
    // Attendance tracking
    attendedAt: { type: Date },
    manualOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
  },
  { timestamps: true }
);


export default mongoose.model('Registration', RegistrationSchema);
