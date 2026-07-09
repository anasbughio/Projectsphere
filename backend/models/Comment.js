const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isDeleted: { type: Boolean, default: false } // Soft-delete flag
}, { timestamps: true });

commentSchema.index({ organizationId: 1, taskId: 1 }); // Performance index
module.exports = mongoose.model('Comment', commentSchema);