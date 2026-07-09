const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Org Admin', 'Project Manager', 'Team Member', 'Client']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    index: { expires: '1m' } // MongoDB auto-delete feature
  }
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);