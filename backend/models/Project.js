const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ADDED: Soft-delete flag according to document
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// ADDED: Compound index according to document
projectSchema.index({ organizationId: 1, _id: 1 });

module.exports = mongoose.model('Project', projectSchema);