const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  // "IF THIS..."
  triggerField: { 
    type: String, 
    enum: ['status', 'priority', 'department'], 
    required: true 
  },
  triggerValue: { 
    type: String, 
    required: true 
  },
  // "THEN DO THAT..."
  actionType: { 
    type: String, 
    enum: ['ASSIGN_USER', 'UPDATE_PRIORITY', 'UPDATE_STATUS'], 
    required: true 
  },
  actionValue: { 
    type: String, 
    required: true // e.g., the User ID to assign, or the new status string
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);