const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const Task = require('../models/Task');

// Add Comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { taskId } = req.params;

    const comment = await Comment.create({
      text,
      taskId,
      createdBy: req.user._id,
      organizationId: req.user.organizationId
    });

    const populatedComment = await comment.populate('createdBy', 'name');
    
    // Socket emit for real-time update
    const io = req.app.get('socketio');
    io.to(req.user.organizationId.toString()).emit('newComment', { taskId, comment: populatedComment });

    res.status(201).json(populatedComment);
  } catch (error) {
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