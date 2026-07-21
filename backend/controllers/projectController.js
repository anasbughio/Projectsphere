const Project = require('../models/Project');
const { logAudit } = require('../utils/auditLogger');
// Create a New Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const project = await Project.create({
      name,
      description,
      status: status || 'Planning',
      organizationId: req.user.organizationId,
      createdBy: req.user._id,
    });
await logAudit({
      organizationId: req.user.organizationId, // this route is protected so user data is avaliable
      user: req.user._id,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project._id,
      details: `Project "${project.name}" was created.`
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Active Projects (Soft-deleted projects hide rahenge)
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      organizationId: req.user.organizationId,
      isDeleted: false // only active projects occur
    }).populate('createdBy', 'name email'); // sending creator name

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // first check project is preset and related to this organization
    const project = await Project.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.name = name || project.name;
    project.description = description || project.description;
    project.status = status || project.status;

    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft Delete a Project
exports.deleteProject = async (req, res) => {
  try {
    // Database se udane ke bajaye sirf flag true kar rahe hain
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { isDeleted: true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};