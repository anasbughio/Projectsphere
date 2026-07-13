const express = require('express');
const router = express.Router();
const { 
  createTask, 
  createGlobalTask, 
  getTasksByProject, 
  updateTaskStatus,
  getGlobalTasks,
  updateTask,
  deleteTask ,
  getTaskAnalytics,
  uploadTaskAttachment,
  getAllOrganizationTasks
} = require('../controllers/taskController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');
// Get all global tasks


router.route('/all').get(protect, getAllOrganizationTasks);
router.route('/global/all').get(protect, getGlobalTasks);


router.route('/global').post(protect, authorizeRoles('Org Admin'), createGlobalTask);

// Create a new project-specific task
router.route('/').post(protect, createTask);

// Get all tasks for a specific project
router.route('/project/:projectId').get(protect, getTasksByProject);

// Update status of any task (Drag & Drop)
router.route('/:id/status').patch(protect, updateTaskStatus);
router.route('/:id').delete(protect, deleteTask);
router.route('/:id').put(protect, updateTask);
router.route('/analytics/stats').get(protect, getTaskAnalytics);
router.post('/:taskId/upload', protect, upload.single('file'), uploadTaskAttachment);
module.exports = router;