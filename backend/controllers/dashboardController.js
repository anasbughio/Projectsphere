const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Organization = require('../models/Organization');
exports.getDashboardMetrics = async (req, res) => {
  try {
    const orgId = req.user.organizationId; // Auth middleware se user ki organization mil jayegi

    // 1. Projects ka data
    const projects = await Project.find({ organizationId: orgId });
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Planning').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // 2. Tasks ka data
    const tasks = await Task.find({ organizationId: orgId });
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status !== 'Done');
    const completedTasksCount = tasks.filter(t => t.status === 'Done').length;

    // 3. Velocity Calculation (Completed Tasks / Total Tasks)
    const velocity = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    // 4. Overdue Tasks Calculation
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done');

    // 5. Revenue Calculation (Agar aapke project mein 'budget' ka field hai)
    // Agar nahi hai, toh ise remove kar dein ya '0' rehne dein
    const totalRevenue = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

    res.status(200).json({
      revenue: totalRevenue,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      velocity,
      totalTasks
    });
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    res.status(500).json({ message: "Server error in fetching dashboard metrics" });
  }
};

exports.getSuperAdminMetrics = async (req, res) => {
  try {

    const totalOrgs = await Organization.countDocuments({ isDeleted: { $ne: true } }); 
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } }); 
    // Count only users with the role 'Org Admin'
    const totalOrgAdmins = await User.countDocuments({ role: 'Org Admin', isDeleted: { $ne: true } });
    const totalProjects = await Project.countDocuments({ isDeleted: { $ne: true } });
    const totalTasks = await Task.countDocuments({ isDeleted: { $ne: true } });

    res.status(200).json({
      totalOrgs,
      totalUsers,
      totalOrgAdmins,
      totalProjects,
      totalTasks
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching platform stats" });
  }
};