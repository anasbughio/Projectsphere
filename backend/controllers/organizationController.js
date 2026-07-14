// backend/controllers/organizationController.js
const Organization = require('../models/Organization');
const User = require('../models/User');
const { getIO } = require('../config/socket');

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
    // Notify connected clients about the new organization
    try { getIO().emit('organizationUpdated', { orgId: organization._id, action: 'created' }); } catch (e) { console.warn('Socket emit failed', e.message); }
  } catch (error) {
    res.status(500).json({ message: 'Error creating organization', error: error.message });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    // Super Admin sees everything; no tenant filtering here
    const organizations = await Organization.find({ isDeleted: { $ne: true } }).sort('-createdAt');
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error: error.message });
  }
};


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


exports.deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;
    console.log("\n➡️ [DEBUG] DELETE REQUEST RECEIVED FOR ORG:", orgId);

    // 1. Soft delete the Organization
    const organization = await Organization.findByIdAndUpdate(
      orgId,
      { isDeleted: true, status: 'Suspended' },
      { new: true } // Returns the updated document from DB
    );

    if (!organization) {
      console.log("❌ [DEBUG] Organization Not Found in DB!");
      return res.status(404).json({ message: 'Organization not found' });
    }

    console.log("✅ [DEBUG] DATABASE UPDATED SUCCESSFULLY.");
    console.log("   - isDeleted status:", organization.isDeleted);
    console.log("   - Current status:", organization.status);

    // 2. Cascade Delete: Suspend all Users
    const userUpdateResult = await User.updateMany(
      { organizationId: orgId }, 
      { isDeleted: true }
    );
    console.log(`✅ [DEBUG] Cascade Delete: ${userUpdateResult.modifiedCount} Users suspended.`);

    try { getIO().emit('organizationUpdated', { orgId, action: 'deleted' }); } catch (e) { console.warn('Socket emit failed', e.message); }

    res.status(200).json({ message: 'Organization successfully deactivated' });
  } catch (error) {
    console.error("❌ [DEBUG] ERROR IN DELETE API:", error);
    res.status(500).json({ message: 'Error deleting organization', error: error.message });
  }
};