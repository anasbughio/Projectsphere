const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
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
    const totalOrgs = await Organization.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalOrgAdmins = await User.countDocuments({ role: 'Org Admin' });
    const activeOrgs = await Organization.countDocuments({ status: 'Active' });
    const suspendedOrgs = await Organization.countDocuments({ status: 'Suspended' });
    const totalProjects = await Project.countDocuments({});
    const totalTasks = await Task.countDocuments({});

    res.status(200).json({
      totalOrgs,
      totalUsers,
      totalOrgAdmins,
      activeOrgs,
      suspendedOrgs,
      totalProjects,
      totalTasks
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching platform stats" });
  }
};


exports.getAuditLogs = async (req, res) => {
  try {
    // Fetch the 10 most recent logs, populate the user who did the action
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email role'); 

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
};