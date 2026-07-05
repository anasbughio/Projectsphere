const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTaskStatus,getGlobalTasks } = require('../controllers/taskController');
const { protect,authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/global/all').get(protect, getGlobalTasks);
router.route('/').post(protect, createTask);
router.route('/project/:projectId').get(protect, getTasksByProject);
router.route('/:id/status').patch(protect, updateTaskStatus);

module.exports = router;