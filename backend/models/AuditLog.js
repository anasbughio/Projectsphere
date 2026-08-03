const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // For multi-tenancy isolation
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },

  // User who performed the action
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // Action name (e.g., 'PROJECT_CREATED', 'USER_INVITED', 'TASK_DELETED')
  action: { 
    type: String, 
    required: true 
  },

  // Entity on which the action was performed (e.g., 'Project', 'User', 'Task')
  entityType: { 
    type: String, 
    required: true 
  },

  // ID of the specific project, task, or user
  entityId: { 
    type: mongoose.Schema.Types.ObjectId 
  },

  // Additional details about the action
  // (e.g., "Haseeb moved task to In Progress")
  details: { 
    type: String 
  }
}, { timestamps: true }); // Automatically creates createdAt and updatedAt fields

module.exports = mongoose.model('AuditLog', auditLogSchema);