const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  attachment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    unique: true 
  }, 
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Waiting on Client', 'Closed'], 
    default: 'Open' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Manager assign any team member
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  // Ticket inside chat
  messages: [ticketMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);