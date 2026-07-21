const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', ref: 'User' },
  type: { type: String, enum: ['TASK_ASSIGNED', 'NEW_COMMENT', 'STATUS_CHANGED'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // Task ID or Project ID
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);