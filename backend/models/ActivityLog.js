const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // who done activity (e.g., Manager, Developer)
  },
  action: { 
    type: String, 
    required: true // e.g., 'Created a new task', 'Completed a task', 'Commented'
  },
  details: { 
    type: String // e.g., 'Task Name: Design Login Page'
  },
  isClientVisible: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);