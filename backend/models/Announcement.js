const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'warning', 'success', 'urgent'], 
      default: 'info' 
    },
    targetAudience: { 
      type: String, 
      enum: ['all', 'tenants', 'clients'], 
      default: 'all' 
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);