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
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    attachments: [
    {
      fileName: String, 
      fileUrl: String,  
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  },
  { timestamps: true }
);

taskSchema.index({ organizationId: 1, projectId: 1, milestoneId: 1 });

// 🔥 1. SINGLE MASTER FUNCTION (Jo Progress aur Status dono update karega)
taskSchema.statics.calculateMilestoneProgress = async function(milestoneId) {
  if (!milestoneId) return;

  try {
    console.log(`\n📊 --- PROGRESS CALCULATION SHURU ---`);
    console.log(`Milestone ID: ${milestoneId}`);
    
    const totalTasks = await this.countDocuments({ milestoneId });
    const completedTasks = await this.countDocuments({ milestoneId, status: 'Done' });

    console.log(`🧮 Total Tasks: ${totalTasks} | Done Tasks: ${completedTasks}`);

    let progress = 0;
    if (totalTasks > 0) {
      progress = Math.round((completedTasks / totalTasks) * 100);
    }

    console.log(`📈 Naya Progress: ${progress}%`);

    const status = progress === 100 ? 'Completed' : 'In Progress';

    // Milestone update karna
    const updatedMilestone = await mongoose.model('Milestone').findByIdAndUpdate(
      milestoneId, 
      { progress, status },
      { new: true } // Ye batayega ke actual update hua ya nahi
    );
    
    if (updatedMilestone) {
      console.log(`✅ Milestone Database mein Update ho gaya! New Progress: ${updatedMilestone.progress}%`);
    } else {
      console.log(`❌ ERROR: Is ID ka Milestone database mein mila hi nahi!`);
    }
    console.log(`------------------------------------\n`);
    
  } catch (err) {
    console.error("Progress calculation error:", err);
  }
};
// 🔥 2. Jab naya Task bane ya update ho
taskSchema.post('save', function(doc) {
  if (doc.milestoneId) {
    doc.constructor.calculateMilestoneProgress(doc.milestoneId);
  }
});

// 🔥 3. Jab task delete ho
taskSchema.post('findOneAndDelete', function(doc) {
  if (doc && doc.milestoneId) {
    doc.constructor.calculateMilestoneProgress(doc.milestoneId);
  }
});

// 🔥 4. Jab Drag & Drop (findOneAndUpdate) use ho
taskSchema.post('findOneAndUpdate', function(doc) {
  
  if (doc && doc.milestoneId) {
    doc.constructor.calculateMilestoneProgress(doc.milestoneId);
  }
});

module.exports = mongoose.model('Task', taskSchema);