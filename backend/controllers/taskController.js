const Task = require('../models/Task');
const Project = require('../models/Project');
const { normalizeRole } = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification'); 
const { logAudit } = require('../utils/auditLogger');
const { getIO } = require('../config/socket');

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

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, department, projectId, assignedTo } = req.body;

    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title, description, status, priority, dueDate, department, projectId, assignedTo,
      isGlobal: false,
      createdBy: req.user._id,
      organizationId: req.user.organizationId,
    });
    await logAudit({
      organizationId: req.user.organizationId, 
      user: req.user._id, // Jis user ne task banaya
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id,
      details: `Task "${task.title}" was created.`
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    const io = getIO();
    
    // 1. Existing Logic: Poori organization ki board screen update karne ke liye
    io.to(req.user.organizationId.toString()).emit('taskCreated', populatedTask);

    // 2. 🔥 NEW LOGIC: Sirf Assigned User ko live Bell Notification bhejne ke liye
    if (assignedTo && String(assignedTo) !== String(req.user._id)) {
      // Step A: Database mein save karein
      const notification = await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}"`,
        relatedId: task._id
      });

      // Step B: Us user ke personal socket room mein push karein
      io.to(String(assignedTo)).emit('newNotification', notification);
    }

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
      title, description, status, priority, dueDate, department, assignedTo,
      isGlobal: true,
      projectId: null,
      createdBy: req.user._id,
      organizationId: req.user.organizationId,
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

   const io = getIO();
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

    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    const query = {
      projectId: projectId,
      organizationId: req.user.organizationId,
      isDeleted: false 
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
    const tasks = await Task.find({ 
      isGlobal: true, 
      organizationId: req.user.organizationId,
      isDeleted: false 
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
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canModifyTask(req.user, task)) return res.status(403).json({ message: 'Unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { status },
      { returnDocument: 'after' }
    ).populate('assignedTo', 'name');

    const io = getIO();
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
      organizationId: req.user.organizationId,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized access' });
    }

    if (!canModifyTask(req.user, task)) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    // Hard delete ki jagah findOneAndUpdate lagaya hai
    await Task.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { isDeleted: true },
      { new: true }
    );

    const io = getIO();
    io.to(req.user.organizationId.toString()).emit('taskDeleted', req.params.id);
    res.json({ message: 'Task moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, department } = req.body;
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canModifyTask(req.user, task)) return res.status(403).json({ message: 'Unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { title, description, priority, department },
      { returnDocument: 'after' }
    ).populate('assignedTo', 'name');

    const io = getIO();
    io.to(req.user.organizationId.toString()).emit('taskUpdated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const statusStats = await Task.aggregate([
      { $match: { organizationId: orgId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { organizationId: orgId, isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const totalTasks = await Task.countDocuments({ organizationId: orgId, isDeleted: false });

    res.status(200).json({
      totalTasks,
      statusStats,
      priorityStats
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics fetch karne mein masla hua", error: error.message });
  }
};


exports.uploadTaskAttachment = async (req, res) => {
  try {
    // Check karein ke file aayi hai ya nahi
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Nayi attachment ka object banayen
    const newAttachment = {
      fileName: req.file.originalname, // User ke computer par jo naam tha
      fileUrl: `/uploads/${req.file.filename}` // Server par save hone wala path
    };

    // Task ke attachments array mein push karein aur save karein
    task.attachments.push(newAttachment);
    await task.save();

    res.status(200).json({ 
      message: 'File attached successfully!', 
      attachment: newAttachment 
    });

  } catch (error) {
    console.error('Attachment Upload Error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};