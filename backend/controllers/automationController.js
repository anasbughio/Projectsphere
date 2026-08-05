const Automation = require('../models/Automation');

// Get all automations for the workspace
exports.getAutomations = async (req, res) => {
  try {
    const automations = await Automation.find({ organizationId: req.user.organizationId });
    res.json(automations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch automations' });
  }
};

// Create a new automation rule
exports.createAutomation = async (req, res) => {
  try {
    const { name, trigger, action } = req.body;
    
    const newAutomation = await Automation.create({
      organizationId: req.user.organizationId,
      name,
      trigger,
      action,
      createdBy: req.user._id
    });

    res.status(201).json(newAutomation);
  } catch (error) {
    console.error('Save Automation Error:', error);
    res.status(500).json({ message: 'Failed to create automation' });
  }
};

// Delete a rule
exports.deleteAutomation = async (req, res) => {
  try {
    await Automation.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });
    res.json({ message: 'Automation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete automation' });
  }
};