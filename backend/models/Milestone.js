const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
    },
    description: String,
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    // Yeh field humein burndown mein madad degi
    progress: {
      type: Number,
      default: 0, // 0 to 100%
    }
  },
  { timestamps: true }
);
milestoneSchema.index({ projectId: 1, organizationId: 1 });
module.exports = mongoose.model('Milestone', milestoneSchema);