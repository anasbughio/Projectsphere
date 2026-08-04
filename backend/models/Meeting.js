const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Weekly Sync-up", "Design Review"
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "10:00 AM"
  meetingLink: { type: String, required: true }, // Zoom or Google Meet link
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);