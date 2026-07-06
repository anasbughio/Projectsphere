const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // --- 1. Basic Task Details (Dono ke liye same) ---
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

    // --- 2. Identity & Isolation (Dono ke liye zaroori) ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Jisne task banaya (Security ke liye lazmi)
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true, // Data strictly ek organization ke andar rakhne ke liye
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // VA team ya kisi specific member ko assign karne ke liye
    },

    // --- 3. The Magic Switch (Project vs Global) ---
    isGlobal: {
      type: Boolean,
      default: false, // Agar true hoga, toh yeh poori organization ka task ban jayega
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // Ab yeh optional hai. Global task mein yeh empty (null) rahega.
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);