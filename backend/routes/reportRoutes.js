const express = require('express');
const router = express.Router();
const { generateWeeklyReport,getWorkspaceAnalytics } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware'); // Aapka auth middleware

// Protected route for logged in users
router.post('/weekly', protect, generateWeeklyReport);
router.get('/workspace-analytics', protect, getWorkspaceAnalytics);
module.exports = router;