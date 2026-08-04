const express = require('express');
const router = express.Router();
const { createMilestone, getMilestonesByProject, updateMilestone } = require('../controllers/milestoneController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createMilestone);
router.get('/project/:projectId', protect, getMilestonesByProject);
router.put('/:id', protect, updateMilestone);

module.exports = router;