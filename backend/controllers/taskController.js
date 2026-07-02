const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create new task
// @route   POST /api/v1/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, projectId } = req.body;

    // 1. Check if project exists and belongs to user's organization
    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // 2. Create Task
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      projectId,
      createdBy: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks for a specific project
// @route   GET /api/v1/tasks/project/:projectId
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Security check: Project user ka hi hona chahiye
    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Task Status (For Drag & Drop Kanban)
// @route   PATCH /api/v1/tasks/:id/status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Sirf status update karna hai
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};