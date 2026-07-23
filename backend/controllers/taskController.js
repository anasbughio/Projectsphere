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
 
    const { title, description, status, priority, dueDate, department, projectId, assignedTo, milestoneId,isClientDeliverable,dependsOn } = req.body;

    const project = await Project.findOne({ 
      _id: projectId, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title, description, status, priority, dueDate, department, projectId, assignedTo,
      milestoneId: milestoneId || null, 
      isClientDeliverable: isClientDeliverable || false,
      dependsOn: dependsOn || null,
      isGlobal: false,
      createdBy: req.user._id,
      organizationId: req.user.organizationId,
    });
    
    await logAudit({
      organizationId: req.user.organizationId, 
      user: req.user._id,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id,
      details: `Task "${task.title}" was created.`
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');
    const io = getIO();
    io.to(req.user.organizationId.toString()).emit('taskCreated', populatedTask);

    if (assignedTo && String(assignedTo) !== String(req.user._id)) {
      const notification = await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}"`,
        relatedId: task._id
      });
      io.to(String(assignedTo)).emit('newNotification', notification);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Create new Global Task (Org Admin Only)
// POST /api/v1/tasks/global
exports.createGlobalTask = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can create global tasks' });
    }

    // 🔥 Yahan milestoneId add kiya
    const { title, description, status, priority, dueDate, department, assignedTo, milestoneId } = req.body;

    const task = await Task.create({
      title, description, status, priority, dueDate, department, assignedTo,
      milestoneId: milestoneId || null, 
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
//   Get tasks for a specific project (Strict User Isolation & Deliverables Check)
//   GET /api/v1/tasks/project/:projectId
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

    // Role check for Client
    const role = normalizeRole(req.user?.role);
    const isClient = role === 'client';
    
    // Security check: Client sirf apna project dekh sake
    if (isClient && project.clientId && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    const query = {
      projectId: projectId,
      organizationId: req.user.organizationId,
      isDeleted: false 
    };

  
    if (isClient) {
   
      query.isClientDeliverable = true;
    } else if (!isAdmin(req.user)) {
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
//    Get ALL Global tasks for the logged-in user's organization
//    GET /api/v1/tasks/global/all
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
    console.log(`\n🚦 --- UPDATE TASK STATUS HIT ---`);
    console.log(`Naya Status jo frontend se aaya: "${status}"`);
    
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

    console.log(`Task ka apna _id: ${updatedTask._id}`);
    console.log(`Task ke andar Milestone ID hai? : ${updatedTask.milestoneId || 'NAHI HAI ❌'}`);

    // Calculation call
    if (updatedTask && updatedTask.milestoneId) {
      console.log(`Milestone ID mil gayi, ab calculation function call ho raha hai...`);
      await Task.calculateMilestoneProgress(updatedTask.milestoneId);
    } else {
      console.log(`❌ Milestone ID nahi mili, isliye calculation skip ho gayi!`);
    }

    const io = getIO();
    io.to(req.user.organizationId.toString()).emit('taskUpdated', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    console.error("Update Status Error:", error);
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
    // adding milestone here
    const { title, description, priority, department, assignedTo, milestoneId, dueDate ,dependsOn,isClientDeliverable} = req.body;
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId,
      isDeleted: false 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canModifyTask(req.user, task)) return res.status(403).json({ message: 'Unauthorized' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id },
      // add and update milestone and duedate
      { title, description, priority, department, dueDate, assignedTo: assignedTo || null, milestoneId: milestoneId || null,
        isClientDeliverable: isClientDeliverable || false,
        dependsOn: dependsOn || null
       },
      { returnDocument: 'after' },
      
    ).populate('assignedTo', 'name');

    try {
      const io = getIO();
      const prevAssignee = task.assignedTo ? String(task.assignedTo) : null;
      if (assignedTo && String(assignedTo) !== prevAssignee) {
        const notification = await Notification.create({
          recipient: assignedTo,
          sender: req.user._id,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to task: "${updatedTask.title}"`,
          relatedId: updatedTask._id
        });
        io.to(String(assignedTo)).emit('newNotification', notification);
      }
    } catch (e) {
      console.warn('Failed to notify assignee on task update', e.message);
    }

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
    // checking file is come or not
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // creating object of new attchment
    const newAttachment = {
      fileName: req.file.originalname, // name of user on computer
      fileUrl: `/uploads/${req.file.filename}` // Server par save hone wala path
    };

    // push the task of attacments in array and save it
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


exports.getAllOrganizationTasks = async (req, res) => {
  try {
    
    const tasks = await Task.find({ organizationId: req.user.organizationId ,
      isDeleted: false
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all organization tasks', error: error.message });
  }
};


exports.getBurndownData = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { projectId } = req.query; // see a specific project

    let query = { organizationId: orgId, isDeleted: false };
    if (projectId) query.projectId = projectId;

    // Tamam tasks fetch karein
    const tasks = await Task.find(query).sort({ createdAt: 1 });
    if (tasks.length === 0) return res.json([]);

    const totalTasks = tasks.length;
    const chartData = [];
    const today = new Date();

    // previous 14 days loop
    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(23, 59, 59, 999); // end of the day

      // how many task created on that day
      const createdUpToDate = tasks.filter(t => new Date(t.createdAt) <= targetDate).length;
      
      // how many tasksdone on that day
      // Note: we use updateDate for completion
      const doneUpToDate = tasks.filter(t => t.status === 'Done' && new Date(t.updatedAt) <= targetDate).length;

      // Actual Remaining Tasks
      const actualRemaining = createdUpToDate - doneUpToDate;

      // Ideal Remaining (Formula: from total to zero)
      const idealRemaining = Math.max(0, Math.round(totalTasks - (totalTasks / 13) * (13 - i)));

      chartData.push({
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Actual: actualRemaining,
        Ideal: idealRemaining
      });
    }

    res.status(200).json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Burndown calculate karne mein masla hua', error: error.message });
  }
};


exports.clientTaskReview = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const io = getIO();
    let notificationTitle = '';
    let notificationMsg = '';

    if (status === 'Done' || status === 'Completed') {
      // when client said for apporve
      task.isClientApproved = true;
      task.status = 'Done';
      
      notificationTitle = 'Task Approved 🎉';
      notificationMsg = `Client has approved the task: "${task.title}"`;
      
    } else {
  
      task.isClientApproved = false;
      task.status = 'In Progress';
      
      notificationTitle = 'Revision Requested 🚨';
      notificationMsg = `Client requested a revision for: "${task.title}"`;
      
      if (comment && comment.trim() !== '') {
        const Comment = require('../models/Comment'); 

        const newComment = await Comment.create({
          text: `[Client Feedback] ${comment}`,
          taskId: task._id,
          createdBy: req.user._id,
          organizationId: req.user.organizationId
        });

        // Chat update event
        const populatedComment = await newComment.populate('createdBy', 'name');
        io.to(req.user.organizationId.toString()).emit('newComment', { 
          taskId: task._id, 
          comment: populatedComment 
        });
      }
    }

    await task.save();

   
    //  REAL-TIME NOTIFICATION SYSTEM (NEWLY ADDED) 
  
    
    // 1. Notify the Assigned Developer
    if (task.assignedTo) {
      const devNotification = await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id, // Client
        type: status === 'Done' ? 'TASK_APPROVED' : 'TASK_REVISED',
        title: notificationTitle,
        message: notificationMsg,
        relatedId: task._id
      });
      // Send real-time alert to Developer
      io.to(String(task.assignedTo)).emit('newNotification', devNotification);
    }

    // 2. Notify the Project Manager / Admin (who created the task)
    if (task.createdBy && String(task.createdBy) !== String(task.assignedTo)) {
      const pmNotification = await Notification.create({
        recipient: task.createdBy,
        sender: req.user._id, // Client
        type: status === 'Done' ? 'TASK_APPROVED' : 'TASK_REVISED',
        title: notificationTitle,
        message: notificationMsg,
        relatedId: task._id
      });
      // Send real-time alert to PM
      io.to(String(task.createdBy)).emit('newNotification', pmNotification);
    }

    // 3. Update the Kanban Board for the whole team instantly
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name');
    io.to(req.user.organizationId.toString()).emit('taskUpdated', populatedTask);
    
  

    res.status(200).json({ message: 'Task updated successfully', task: populatedTask });
  } catch (error) {
    console.error('Client Review Error:', error);
    res.status(500).json({ message: error.message });
  }
};