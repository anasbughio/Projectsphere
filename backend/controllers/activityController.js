const ActivityLog = require('../models/ActivityLog');

exports.getRecentActivities = async (req, res) => {
  try {
    let query = { organizationId: req.user.organizationId };


    if (req.user.role && req.user.role.toLowerCase() === 'client') {
      query.isClientVisible = true;
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10); 

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Server Error" });
  }
};