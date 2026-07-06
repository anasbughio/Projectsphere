const Task = require('../models/Task');
const Project = require('../models/Project');
const { normalizeRole } = require('../middlewares/authMiddleware');

const isAdmin = (user) => normalizeRole(user?.role) === 'admin';

const canModifyTask = (user, task) => {
  if (!user || !task) return false;
  if (isAdmin(user)) return true;

  const userId = user._id?.toString();
  if (!userId) return false;

  return (
    task.createdBy?.toString() === userId ||
    task.assignedTo?.toString() === userId
  );
};

// @desc    Create new Project Task (Regular Task)
// @route   POST /api/v1/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, department, projectId, assignedTo } = req.body;

    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId 
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title, description, status, priority, dueDate, department, projectId, assignedTo,
      isGlobal: false,
      createdBy: req.user._id,
      organizationId: req.user.organizationId,
    });

    // Populate for socket to have complete object
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    // Socket Emit
    const io = req.app.get('socketio');
    io.to(req.user.organizationId.toString()).emit('taskCreated', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Create new Global Task (Org Admin Only)
// @route   POST /api/v1/tasks/global
exports.createGlobalTask = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can create global tasks' });
    }

    const { title, description, status, priority, dueDate, department, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      department,
      assignedTo,
      isGlobal: true,
      projectId: null,
      createdBy: req.user._id,
      organizationId: req.user.organizationId,
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    const io = req.app.get('socketio');
    io.to(req.user.organizationId.toString()).emit('taskCreated', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks for a specific project (Strict User Isolation)
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

    const query = {
      projectId: projectId,
      organizationId: req.user.organizationId,
    };

    if (!isAdmin(req.user)) {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const tasks = await Task.find(query)
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL Global tasks for the logged-in user's organization
// @route   GET /api/v1/tasks/global/all
exports.getGlobalTasks = async (req, res) => {
  try {
    // Sirf is organization ke global tasks uthayen (Poori team ke liye visible)
    const tasks = await Task.find({ 
      isGlobal: true, 
      organizationId: req.user.organizationId 
    })
    .populate('assignedTo', 'name')
    .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canModifyTask(req.user, task)) return res.status(403).json({ message: 'Unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { status },
      { new: true }
    ).populate('assignedTo', 'name');

    // Socket Emit
    const io = req.app.get('socketio');
    io.to(req.user.organizationId.toString()).emit('taskUpdated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized access' });
    }

    if (!canModifyTask(req.user, task)) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    await Task.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
const io = req.app.get('socketio');
io.to(req.user.organizationId.toString()).emit('taskDeleted', req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, department } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canModifyTask(req.user, task)) return res.status(403).json({ message: 'Unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { title, description, priority, department },
      { new: true }
    ).populate('assignedTo', 'name');

    // Socket Emit
    const io = req.app.get('socketio');
    io.to(req.user.organizationId.toString()).emit('taskUpdated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTaskAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // 1. Status ke hisaab se tasks count karna (To Do, In Progress, Done)
    const statusStats = await Task.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 2. Priority ke hisaab se tasks count karna
    const priorityStats = await Task.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 3. Total Tasks
    const totalTasks = await Task.countDocuments({ organizationId: orgId });

    res.status(200).json({
      totalTasks,
      statusStats,
      priorityStats
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics fetch karne mein masla hua", error: error.message });
  }
};