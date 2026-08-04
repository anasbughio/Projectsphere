const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  createWorkflow, 
  getWorkflows, 
  deleteWorkflow, 
  toggleWorkflow 
} = require('../controllers/workflowController');

router.post('/', protect, createWorkflow);
router.get('/', protect, getWorkflows);
router.delete('/:id', protect, deleteWorkflow);
router.patch('/:id/toggle', protect, toggleWorkflow);

module.exports = router;