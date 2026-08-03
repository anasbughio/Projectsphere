const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    default: ''
  },
  // The actual encrypted string
  encryptedValue: {
    type: String,
    required: true
  },
  // The unique random bytes used to salt this specific encryption
  iv: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('VaultItem', vaultItemSchema);