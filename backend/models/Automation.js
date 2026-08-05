const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true }, // e.g., "Auto-check Deliverable on Urgent"
  isActive: { type: Boolean, default: true },
  
  // IF THIS...
  trigger: {
    entity: { type: String, enum: ['Task', 'Project', 'Milestone'], required: true },
    event: { type: String, enum: ['created', 'updated', 'deleted'], required: true },
    conditions: [{
      field: String, // e.g., "priority"
      operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than'] },
      value: mongoose.Schema.Types.Mixed // e.g., "Urgent"
    }]
  },

  // THEN THAT...
  action: {
    type: { type: String, enum: ['update_field', 'send_notification', 'assign_user', 'create_task'], required: true },
    payload: mongoose.Schema.Types.Mixed // e.g., { field: "isClientDeliverable", value: true }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Automation', automationSchema);