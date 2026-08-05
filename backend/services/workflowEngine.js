// Inside taskController.js -> updateTask
const eventEmitter = require('../services/workflowEngine');

eventEmitter.emit('entity_updated', {
  entityType: 'Task',
  organizationId: req.user.organizationId,
  previousState: oldTask,
  newState: updatedTask
});

