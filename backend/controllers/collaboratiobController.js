const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// Add Comment
exports.addComment = async (req, res) => {
  try {
    // Safety check
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { text } = req.body;
    const { taskId } = req.params;

    const comment = await Comment.create({
      text,
      taskId,
      createdBy: req.user._id,
      organizationId: req.user.organizationId
    });

    const populatedComment = await comment.populate('createdBy', 'name');
    
const io = getIO(); // 🔥 Ab hum naye socket file se IO le rahe hain
io.to(req.user.organizationId.toString()).emit('newComment', { taskId, comment: populatedComment });

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("AddComment Error:", error); // Console mein error dekhein
    res.status(500).json({ message: error.message });
  }
};

// Get Task Comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId, isDeleted: false })
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30); 
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};