const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Multi-tenancy isolation ke liye
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  // Jis user ne action perform kiya
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Action ka naam (e.g., 'PROJECT_CREATED', 'USER_INVITED', 'TASK_DELETED')
  action: { 
    type: String, 
    required: true 
  },
  // Kis cheez par action hua (e.g., 'Project', 'User', 'Task')
  entityType: { 
    type: String, 
    required: true 
  },
  // Us specific project, task ya user ki ID
  entityId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  // Koi additional detail (e.g., "Haseeb moved task to In Progress")
  details: { 
    type: String 
  }
}, { timestamps: true }); // timestamps automatically createdAt aur updatedAt bana dega

module.exports = mongoose.model('AuditLog', auditLogSchema);