const Organization = require('../models/Organization');
const User = require('../models/User');
const Project = require('../models/Project');

// 1. Fetch all tenant subscriptions with user/project counts
exports.getTenantSubscriptions = async (req, res) => {
  try {
  
    const tenants = await Organization.find({ isDeleted: false }).select('name subscriptionPlan maxUsers maxProjects expiresAt status createdAt');
    
    console.log("RAW TENANTS FROM DB:", tenants);

    const tenantData = await Promise.all(
      tenants.map(async (tenant) => {
        const userCount = await User.countDocuments({ organizationId: tenant._id, isDeleted: false });
        const projectCount = await Project.countDocuments({ organizationId: tenant._id, isDeleted: false });

        return {
          _id: tenant._id,
          name: tenant.name,
          //  Direct schema fields access
          plan: tenant.subscriptionPlan ? tenant.subscriptionPlan.toUpperCase() : 'FREE',
          status: tenant.status || 'Active',
          maxUsers: tenant.maxUsers !== undefined ? tenant.maxUsers : 5,
          maxProjects: tenant.maxProjects !== undefined ? tenant.maxProjects : 3,
          expiresAt: tenant.expiresAt || null,
          userCount,
          projectCount,
          createdAt: tenant.createdAt
        };
      })
    );

    res.status(200).json(tenantData);
  } catch (error) {
    console.error("Error fetching tenant subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscription data" });
  }
};
// 2. Update tenant plan & limits
exports.updateTenantSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plan, status, maxUsers, maxProjects, expiresAt } = req.body;

    const tenant = await Organization.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant organization not found' });
    }

    //  Update fields correctly matching your schema
    tenant.subscriptionPlan = plan ? plan.toLowerCase() : tenant.subscriptionPlan; // 'free', 'pro', 'enterprise'
    tenant.status = status || tenant.status;
    tenant.maxUsers = maxUsers !== undefined ? maxUsers : tenant.maxUsers;
    tenant.maxProjects = maxProjects !== undefined ? maxProjects : tenant.maxProjects;
    tenant.expiresAt = expiresAt ? new Date(expiresAt) : tenant.expiresAt;

    await tenant.save();

    res.status(200).json({ 
      message: `Subscription updated successfully for ${tenant.name}`,
      tenant 
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
};