const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { 
    type:  mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  text: { type: String, required: false },
  fileUrl: { type: String },
  fileType: { type: String },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
module.exports = mongoose.model('Message', messageSchema);