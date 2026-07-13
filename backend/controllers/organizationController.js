// backend/controllers/organizationController.js
const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Create a new organization
// @route   POST /api/organizations
// @access  Private (Super Admin only)
exports.createOrganization = async (req, res) => {
  try {
    const { name, domain, subscriptionPlan } = req.body;
    
    const organization = await Organization.create({
      name,
      domain,
      subscriptionPlan: subscriptionPlan || 'Free',
      status: 'Active'
    });

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Error creating organization', error: error.message });
  }
};

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Private (Super Admin only)
exports.getAllOrganizations = async (req, res) => {
  try {
    // Super Admin sees everything; no tenant filtering here
    const organizations = await Organization.find({ isDeleted: { $ne: true } }).sort('-createdAt');
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error: error.message });
  }
};

// @desc    Update organization status/details
// @route   PUT /api/organizations/:id
// @access  Private (Super Admin only)
exports.updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Error updating organization', error: error.message });
  }
};

// @desc    Soft Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private (Super Admin only)
exports.deleteOrganization = async (req, res) => {
  try {
    // Soft delete as per SOD requirements
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, status: 'Suspended' },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json({ message: 'Organization successfully deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting organization', error: error.message });
  }
};