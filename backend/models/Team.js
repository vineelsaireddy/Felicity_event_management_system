import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    teamSize: { type: Number, required: true },
    inviteCode: { type: String, unique: true, required: true },
    members: [
      {
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
        email: { type: String },
        invitationStatus: {
          type: String,
          enum: ['Pending', 'Accepted', 'Rejected'],
          default: 'Pending',
        },
        joinedDate: { type: Date },
      },
    ],
    registrationStatus: {
      type: String,
      enum: ['Forming', 'Complete', 'Cancelled'],
      default: 'Forming',
    },
    teamTicketId: { type: String },
    ticketIds: [{ type: String }], // QR codes for all members
    registrationDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Team', TeamSchema);
