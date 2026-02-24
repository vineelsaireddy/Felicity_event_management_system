import mongoose from 'mongoose';

const HackathonRegistrationSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    members: [
      {
        participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
        email: { type: String },
        ticketId: { type: String },
        qrCode: { type: String },
        attendanceStatus: {
          type: String,
          enum: ['Not Attended', 'Attended'],
          default: 'Not Attended',
        },
      },
    ],
    registrationStatus: {
      type: String,
      enum: ['Pending', 'Complete', 'Cancelled'],
      default: 'Pending',
    },
    formData: { type: mongoose.Schema.Types.Mixed },
    registrationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('HackathonRegistration', HackathonRegistrationSchema);
