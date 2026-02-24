import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, enum: ['participant', 'organizer', 'admin'], required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    requestReason: { type: String },
    temporaryPassword: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
    requestDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('PasswordReset', PasswordResetSchema);
