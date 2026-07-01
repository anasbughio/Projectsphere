const Project = require('../models/Project');

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
    // Sirf wahi projects fetch honge jo user ki organization ke hain
    const projects = await Project.find({ organizationId: req.user.organizationId })
                                  .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};