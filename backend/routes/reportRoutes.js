const express = require('express');
const router = express.Router();
const { generateWeeklyReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware'); // Aapka auth middleware

// Protected route for logged in users
router.post('/weekly', protect, generateWeeklyReport);

module.exports = router;