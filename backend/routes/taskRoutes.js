const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

// Saare routes protected hain
router.route('/').post(protect, createTask);
router.route('/project/:projectId').get(protect, getTasksByProject);
router.route('/:id/status').patch(protect, updateTaskStatus);

module.exports = router;