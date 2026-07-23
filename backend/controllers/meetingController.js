const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const Project = require('../models/Project');
// create meeting for manager
exports.createMeeting = async (req, res) => {
  try {
    const { title, date, time, meetingLink, projectId } = req.body;
    
    // Find the project to get its associated client
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Extract client ID from project (supports both 'client' or 'clientId' field names)
    const clientId = project.client || project.clientId; 

    if (!clientId) {
      return res.status(400).json({ message: "No client is assigned to this project yet!" });
    }

    const newMeeting = await Meeting.create({
      title, 
      date, 
      time, 
      meetingLink, 
      projectId,
      clientId, // Automatically assigned from project
      organizationId: req.user.organizationId,
      createdBy: req.user._id
    });

    res.status(201).json(newMeeting);
  } catch (error) {
    console.error("Create Meeting Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getClientCalendarData = async (req, res) => {
  try {
    // Fetch upcoming meetings for this specific client
    const meetings = await Meeting.find({
      organizationId: req.user.organizationId,
      clientId: req.user._id,
      date: { $gte: new Date(new Date().setHours(0,0,0,0)) } // Today's and future meetings
    }).sort({ date: 1 }).populate('projectId', 'name');

    // Fetch Client deliverable tasks
    const tasks = await Task.find({
      organizationId: req.user.organizationId,
      isClientDeliverable: true,
      dueDate: { $ne: null }
    }).select('title dueDate status');

    res.status(200).json({ meetings, tasks });
  } catch (error) {
    console.error("Calendar Data Error:", error);
    res.status(500).json({ message: error.message });
  }
};



