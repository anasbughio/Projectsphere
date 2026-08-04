const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isDeleted: { type: Boolean, default: false } // Soft-delete flag
}, { timestamps: true });

attachmentSchema.index({ organizationId: 1, taskId: 1 }); // Performance index
module.exports = mongoose.model('Attachment', attachmentSchema);