const mongoose = require('mongoose');

const wikiSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true // Ensures only one master wiki exists per project
    },
    content: {
      type: String, 
      default: '<h1>Project Wiki</h1><p>Start documenting your project strategy, APIs, and notes here...</p>'
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wiki', wikiSchema);