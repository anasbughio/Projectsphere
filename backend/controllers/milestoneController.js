const Milestone = require('../models/Milestone');
const Task = require('../models/Task');

// Create a new milestone
exports.createMilestone = async (req, res) => {
  try {
    const { title, description, dueDate, projectId } = req.body;
    const milestone = await Milestone.create({
      title,
      description,
      dueDate,
      projectId,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: "Error creating milestone", error: error.message });
  }
};

// Get all milestones for a specific project
exports.getMilestonesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const milestones = await Milestone.find({ projectId, organizationId: req.user.organizationId });
    res.status(200).json(milestones);
  } catch (error) {
    res.status(500).json({ message: "Error fetching milestones", error: error.message });
  }
};

// Update Milestone (Manual status change if needed)
exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(milestone);
  } catch (error) {
    res.status(500).json({ message: "Error updating milestone", error: error.message });
  }
};