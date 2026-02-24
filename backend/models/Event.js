import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['Normal', 'Merchandise', 'Hackathon'], required: true },
    eligibility: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationLimit: { type: Number, required: true },
    registrationFee: { type: Number, default: 0 },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Ongoing', 'Closed', 'Completed'],
      default: 'Draft',
    },
    participants: [
      {
        participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
        registrationDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['Registered', 'Attended', 'Completed', 'Cancelled'],
          default: 'Registered',
        },
        ticketId: { type: String },
        teamId: { type: String },
      },
    ],
    customForm: {
      fields: [
        {
          fieldId: { type: String },
          fieldName: { type: String },
          fieldType: {
            type: String,
            enum: ['text', 'textarea', 'email', 'number', 'date', 'select', 'checkbox', 'radio', 'file'],
          },
          required: { type: Boolean, default: false },
          options: [{ type: String }],
          order: { type: Number },
        },
      ],
      isLocked: { type: Boolean, default: false },
    },
    // Merchandise specific fields
    merchandise: {
      items: [
        {
          itemId: { type: String },
          name: { type: String },
          size: { type: String },
          color: { type: String },
          variants: [{ type: String }],
          stock: { type: Number },
          price: { type: Number },
          image: { type: String }, // file path to uploaded image
          description: { type: String },
        },
      ],
      purchaseLimit: { type: Number },
    },
    analytics: {
      totalRegistrations: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      attendance: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Event', EventSchema);
