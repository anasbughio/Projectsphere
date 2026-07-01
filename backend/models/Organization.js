const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
    type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true, // Zaroori nahi ke har company ka domain start mein ho
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);