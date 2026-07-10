const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail'); // Aapka email wala function

exports.generateWeeklyReport = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    
    // Pichle 7 din ki date set karein
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Database Se Metrics Fetch Karein
    const completedTasks = await Task.countDocuments({ 
      organizationId: orgId, 
      status: 'Done',
      updatedAt: { $gte: sevenDaysAgo } 
    });

    const newTasks = await Task.countDocuments({
      organizationId: orgId,
      createdAt: { $gte: sevenDaysAgo }
    });

    const overdueTasks = await Task.countDocuments({
      organizationId: orgId,
      status: { $ne: 'Done' },
      dueDate: { $lt: new Date() }
    });

    const activeProjects = await Project.countDocuments({
      organizationId: orgId,
      status: { $in: ['Active', 'Planning'] } // Planning ya Active projects
    });

    // 2. Email ke liye HTML Template Banayen
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #7c7fff; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">Weekly ProjectSphere Report 🚀</h2>
          <p style="margin: 5px 0 0;">Here is your team's performance for the last 7 days.</p>
        </div>
        <div style="padding: 20px;">
          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">📊 7-Day Snapshot</h3>
          <ul style="list-style-type: none; padding: 0; font-size: 16px;">
            <li style="margin-bottom: 10px;">✅ <strong>Tasks Completed:</strong> ${completedTasks}</li>
            <li style="margin-bottom: 10px;">🆕 <strong>New Tasks Added:</strong> ${newTasks}</li>
            <li style="margin-bottom: 10px;">⚠️ <strong>Overdue Tasks:</strong> <span style="color: red;">${overdueTasks}</span></li>
            <li style="margin-bottom: 10px;">📁 <strong>Active Projects:</strong> ${activeProjects}</li>
          </ul>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">Keep up the great work! Login to your dashboard for real-time updates.</p>
        </div>
      </div>
    `;

    // 3. Email Send Karein (Abhi test ke liye jo user login hai usay bhej rahe hain)
    await sendEmail({
      email: req.user.email,
      subject: 'ProjectSphere - Your Weekly Performance Report',
      html: emailHtml
    });

    res.status(200).json({ message: 'Weekly report sent successfully to your email!' });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to generate report", error: error.message });
  }
};