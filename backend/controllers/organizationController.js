// backend/controllers/organizationController.js
const Organization = require('../models/Organization');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
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

    // 🔥 MINOR TWEAK: Isay bhi try-catch mein daal diya taake app safe rahay
    try {
      const userId = req.user ? (req.user._id || req.user.id) : null; 
      await AuditLog.create({
        organizationId: organization._id,
        user: userId,
        action: `Organization '${organization.name}' was created.`,
        entityType: 'Organization',
        entityId: organization._id
      });
    } catch (logError) {
      console.error("⚠️ Audit Log Warning (Creation):", logError.message);
    }

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

exports.toggleOrganizationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Active', 'Suspended'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    try {
      const actionText = status === 'Active' ? 'Unblocked' : 'Suspended';
      const userId = req.user ? (req.user._id || req.user.id) : null; 

      await AuditLog.create({
        organizationId: organization._id, // Fixed order for consistency
        user: userId,
        action: `Organization '${organization.name}' was ${actionText} by Super Admin.`,
        entityType: 'Organization',
        entityId: organization._id // 🔥 MINOR TWEAK: Yeh missing tha, add kar diya
      });
      
      // Socket emit for real-time feed update
      if (getIO) {
        getIO().emit('organizationUpdated', { orgId: organization._id, action: 'status_changed' });
      }
    } catch (logError) {
      console.error("⚠️ Audit Log Warning (Non-Fatal):", logError.message);
    }

    res.status(200).json({
      ...organization.toObject(),
      message: status === 'Suspended' ? 'Organization blocked successfully' : 'Organization unblocked successfully'
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: 'Error updating organization status', error: error.message });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const ownerAdmin = await User.findOne({ organizationId: orgId, role: 'Org Admin' });

    // 🔥 MINOR TWEAK: Try-Catch add kar diya
    try {
      const userId = req.user ? (req.user._id || req.user.id) : null;
      await AuditLog.create({
        organizationId: orgId,
        user: userId,
        action: `Organization '${organization.name}' was permanently deleted.`,
        entityType: 'Organization',
        entityId: orgId
      });
    } catch (logError) {
      console.error("⚠️ Audit Log Warning (Deletion):", logError.message);
    }

    await Organization.findByIdAndDelete(orgId);
    await User.deleteMany({ organizationId: orgId });

    if (ownerAdmin) {
      await User.findByIdAndDelete(ownerAdmin._id);
    }

    try { getIO().emit('organizationUpdated', { orgId, action: 'deleted' }); } catch (e) { console.warn('Socket emit failed', e.message); }

    res.status(200).json({ message: 'Organization permanently deleted' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Error deleting organization', error: error.message });
  }
};