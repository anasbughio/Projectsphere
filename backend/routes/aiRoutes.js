const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateSubtasks } = require('../controllers/aiController');

// Using POST so we can send the task title/description in the request body
router.post('/breakdown', protect, generateSubtasks);

module.exports = router;