const TimeLog = require('../models/TimeLog');

exports.logTime = async (req, res) => {
  try {
    const { taskId, projectId, durationMinutes, description } = req.body;

    if (!taskId || !projectId || !durationMinutes) {
      return res.status(400).json({ message: 'Task ID, Project ID, and duration are required.' });
    }

    const timeLog = await TimeLog.create({
      taskId,
      projectId,
      userId: req.user._id,
      organizationId: req.user.organizationId,
      durationMinutes: Number(durationMinutes),
      description: description || ''
    });

    const populatedLog = await TimeLog.findById(timeLog._id).populate('userId', 'name');
    res.status(201).json(populatedLog);
  } catch (error) {
    console.error('Log time error:', error);
    res.status(500).json({ message: 'Failed to log time entry.' });
  }
};

exports.getTaskTimeLogs = async (req, res) => {
  try {
    const logs = await TimeLog.find({ taskId: req.params.taskId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task time logs.' });
  }
};

exports.getProjectTimeSummary = async (req, res) => {
  try {
    const logs = await TimeLog.find({ projectId: req.params.projectId });
    const totalMinutes = logs.reduce((acc, log) => acc + log.durationMinutes, 0);
    
    res.json({
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2),
      logsCount: logs.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project time summary.' });
  }
};

exports.deleteTimeLog = async (req, res) => {
  try {
    const log = await TimeLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Time log not found.' });

    if (log.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this time entry.' });
    }

    await log.deleteOne();
    res.json({ message: 'Time log deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete time log.' });
  }
};