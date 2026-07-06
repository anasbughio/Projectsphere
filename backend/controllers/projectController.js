const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Create new project
// @route   POST /api/v1/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      organizationId: req.user.organizationId, // Data isolation enforced
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects for the logged-in user's organization
// @route   GET /api/v1/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ organizationId: req.user.organizationId })
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project and its tasks
// @route   DELETE /api/v1/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized access' });
    }

    await Task.deleteMany({
      projectId: project._id,
      organizationId: req.user.organizationId,
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};