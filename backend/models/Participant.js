import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ParticipantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    participantType: {
      type: String,
      enum: ['IIIT', 'Non-IIIT'],
      required: true,
    },
    collegeOrgName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    role: { type: String, default: 'participant' },
    areasOfInterest: [{ type: String }],
    followedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' }],
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
ParticipantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
ParticipantSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Participant', ParticipantSchema);
