const Workflow = require('../models/Workflow');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

exports.runWorkflows = async (task) => {
  try {
    // 1. Get all active workflows for this organization
    const workflows = await Workflow.find({ 
      organizationId: task.organizationId, 
      isActive: true 
    });

    if (workflows.length === 0) return;

    for (let rule of workflows) {
      // 2. CHECK THE TRIGGER CONDITION
      let conditionMet = false;
      if (rule.triggerField === 'status' && task.status === rule.triggerValue) conditionMet = true;
      if (rule.triggerField === 'priority' && task.priority === rule.triggerValue) conditionMet = true;
      if (rule.triggerField === 'department' && task.department === rule.triggerValue) conditionMet = true;

      // 3. EXECUTE THE ACTION
      if (conditionMet) {
        console.log(`⚡ Automated Workflow Triggered: ${rule.name}`);
        let updateData = {};
        
        if (rule.actionType === 'ASSIGN_USER') {
          updateData.assignedTo = rule.actionValue;
        } else if (rule.actionType === 'UPDATE_PRIORITY') {
          updateData.priority = rule.actionValue;
        } else if (rule.actionType === 'UPDATE_STATUS') {
          updateData.status = rule.actionValue;
        }

        // Apply the automated update to the database
        if (Object.keys(updateData).length > 0) {
          const updatedTask = await Task.findByIdAndUpdate(
            task._id, 
            updateData, 
            { new: true }
          ).populate('assignedTo', 'name');
          
          // Emit real-time socket update so the board updates instantly
          const io = getIO();
          io.to(task.organizationId.toString()).emit('taskUpdated', updatedTask);

          // If assigned to a new user, send them a notification
          if (rule.actionType === 'ASSIGN_USER') {
            const notification = await Notification.create({
              recipient: rule.actionValue,
              sender: task.createdBy, 
              type: 'TASK_ASSIGNED',
              title: 'Automated Assignment 🤖',
              message: `A workflow automatically assigned you to: "${task.title}"`,
              relatedId: task._id
            });
            io.to(String(rule.actionValue)).emit('newNotification', notification);
          }
        }
      }
    }
  } catch (error) {
    console.error("Workflow Engine Error:", error);
  }
};