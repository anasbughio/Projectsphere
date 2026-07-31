const Task = require('../models/Task');
const User = require('../models/User');

exports.getTeamWorkload = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    // 1. Fetch all users in the organization
    const team = await User.find({ organizationId }).select('name role');

    // 2. Fetch all active tasks (not Done/Completed)
    const activeTasks = await Task.find({ 
      organizationId, 
      status: { $nin: ['Done', 'Completed'] } 
    });

    // 3. Aggregate data per user
    const workloadData = team.map(member => {
      const userTasks = activeTasks.filter(t => 
        t.assignedTo && t.assignedTo.toString() === member._id.toString()
      );
      
      const taskCount = userTasks.length;
      
      // Calculate estimated hours (Assuming ~5 hours per active task as a baseline)
      // If you add an 'estimatedHours' field to tasks later, you can sum it here instead.
      const estimatedHours = taskCount * 5; 
      
      const capacity = 40; // Standard 40-hour work week
      
      return {
        userId: member._id,
        name: member.name,
        role: member.role,
        taskCount,
        estimatedHours,
        capacity,
        isOverloaded: estimatedHours > capacity
      };
    });

    // Sort so overloaded members appear at the top
    workloadData.sort((a, b) => b.estimatedHours - a.estimatedHours);

    res.json(workloadData);
  } catch (error) {
    console.error("Workload fetch error:", error);
    res.status(500).json({ message: 'Failed to fetch team workload data' });
  }
};