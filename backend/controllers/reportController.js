const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.generateWeeklyReport = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    
    // set date of previous 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    
    // 1. WEEKLY METRICS (previous 7 days)
    
    const completedTasksThisWeek = await Task.countDocuments({ 
      organizationId: orgId, 
      status: 'Done',
      updatedAt: { $gte: sevenDaysAgo },
      isDeleted: false // ignore soft delete task
    });

    const newTasksThisWeek = await Task.countDocuments({
      organizationId: orgId,
      createdAt: { $gte: sevenDaysAgo },
      isDeleted: false
    });

    const activeProjects = await Project.countDocuments({
      organizationId: orgId,
      status: { $in: ['Active', 'Planning'] },
      isDeleted: false
    });

    
    // 2. OVERALL METRICS (Health & Velocity ke liye)
    
    const totalTasks = await Task.countDocuments({
      organizationId: orgId,
      isDeleted: false
    });

    const totalCompleted = await Task.countDocuments({
      organizationId: orgId,
      status: 'Done',
      isDeleted: false
    });

    const totalOverdue = await Task.countDocuments({
      organizationId: orgId,
      status: { $ne: 'Done' },
      dueDate: { $lt: new Date() },
      isDeleted: false
    });

    //  DYNAMIC CALCULATIONS (Matching Frontend Logic)
    // Velocity = (Completed / Total) * 100
    const teamVelocity = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    
    // Health = 100 - (Overdue / Total) * 100
    const workspaceHealth = totalTasks === 0 ? 100 : Math.max(0, Math.round(100 - ((totalOverdue / totalTasks) * 100)));

    // Health Score color logic
    const healthColor = workspaceHealth > 80 ? '#10b981' : workspaceHealth > 50 ? '#f59e0b' : '#ef4444';

   
    // ENHANCED EMAIL HTML TEMPLATE
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #5a5fe0; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">Workspace Performance Report 🚀</h2>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">ProjectSphere Enterprise Analytics</p>
        </div>
        
        <div style="padding: 25px;">
          
          <!-- HEALTH & VELOCITY SECTION -->
          <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; color: #1a1c26; margin-top: 0;">🌟 Overall Workspace Health</h3>
          <table style="width: 100%; margin-bottom: 25px; font-size: 16px;">
            <tr>
              <td style="padding: 10px 0;">❤️ <strong>Health Score:</strong></td>
              <td style="text-align: right; color: ${healthColor}; font-weight: bold; font-size: 18px;">${workspaceHealth}%</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">⚡ <strong>Team Velocity:</strong></td>
              <td style="text-align: right; color: #7c7fff; font-weight: bold; font-size: 18px;">${teamVelocity}%</td>
            </tr>
          </table>

          <!-- WEEKLY ACTIVITY SECTION -->
          <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; color: #1a1c26;">📊 Last 7-Days Activity</h3>
          <ul style="list-style-type: none; padding: 0; font-size: 15px; color: #4b4e63;">
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>✅ Tasks Completed This Week</span> <strong>${completedTasksThisWeek}</strong>
            </li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>🆕 New Tasks Added</span> <strong>${newTasksThisWeek}</strong>
            </li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>⚠️ Pending Overdue Tasks</span> <strong style="color: #ef4444;">${totalOverdue}</strong>
            </li>
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>📁 Active Projects</span> <strong>${activeProjects}</strong>
            </li>
          </ul>
          
          <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #84889c;">Keep up the great work! Login to your ProjectSphere dashboard for real-time task allocations and project tracking.</p>
          </div>
        </div>
      </div>
    `;

    // send email
    await sendEmail({
      email: req.user.email,
      subject: 'ProjectSphere - Workspace Health & Velocity Report',
      html: emailHtml
    });

    res.status(200).json({ message: 'Detailed report sent successfully to your email!' });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to generate report", error: error.message });
  }
};