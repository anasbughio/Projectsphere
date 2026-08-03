const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  logTime, 
  getTaskTimeLogs, 
  getProjectTimeSummary, 
  deleteTimeLog 
} = require('../controllers/timeLogController');

router.post('/', protect, logTime);
router.get('/task/:taskId', protect, getTaskTimeLogs);
router.get('/project/:projectId', protect, getProjectTimeSummary);
router.delete('/:id', protect, deleteTimeLog);

module.exports = router;