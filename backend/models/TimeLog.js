const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  durationMinutes: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  description: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);