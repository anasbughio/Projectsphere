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
      sparse: true, // not necessary every company domain in start
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    
    maxUsers: {
      type: Number,
      default: 5, // Free plan default limit
    },
    maxProjects: {
      type: Number,
      default: 3, // Free plan default limit
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration (lifetime/unlimited for Free)
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active'
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);