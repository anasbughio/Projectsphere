const Workflow = require('../models/Workflow');
const { normalizeRole } = require('../middlewares/authMiddleware');

const isAdmin = (user) => normalizeRole(user?.role) === 'admin';

exports.createWorkflow = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Admins can create workflows' });
    }

    const { name, triggerField, triggerValue, actionType, actionValue } = req.body;

    const workflow = await Workflow.create({
      organizationId: req.user.organizationId,
      name,
      triggerField,
      triggerValue,
      actionType,
      actionValue,
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Admins can delete workflows' });
    }

    await Workflow.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });
    
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleWorkflow = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only Admins can modify workflows' });
    }

    const workflow = await Workflow.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });

    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};