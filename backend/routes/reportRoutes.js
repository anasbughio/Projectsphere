const express = require('express');
const router = express.Router();
const { generateWeeklyReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware'); // Aapka auth middleware

// Protected route (Sirf logged-in users ke liye)
router.post('/weekly', protect, generateWeeklyReport);

module.exports = router;