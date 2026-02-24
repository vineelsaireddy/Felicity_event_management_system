import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    items: [
      {
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: String },
        color: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentProof: { type: String }, // Image URL or file path
    status: {
      type: String,
      enum: ['Pending Approval', 'Successful', 'Rejected'],
      default: 'Pending Approval',
    },
    ticketId: { type: String }, // Generated only after approval
    qrCode: { type: String }, // Generated only after approval
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' },
    approvalDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);
