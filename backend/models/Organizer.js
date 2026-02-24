import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const OrganizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true, lowercase: true },
    contactNumber: { type: String },
    loginEmail: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: 'organizer' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    discordWebhook: { type: String },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
OrganizerSchema.pre('save', async function (next) {
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
OrganizerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Organizer', OrganizerSchema);
