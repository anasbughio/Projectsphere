const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    department: {
      type: String,
      enum: ['Design', 'Frontend', 'Backend', 'DevOps', 'General'],
      default: 'General',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    // ADDED: Soft-delete flag according to document
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// ADDED: Compound index on organizationId and projectId for fast tenant-scoped queries
taskSchema.index({ organizationId: 1, projectId: 1 });

module.exports = mongoose.model('Task', taskSchema);