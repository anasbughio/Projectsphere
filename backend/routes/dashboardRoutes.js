const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/metrics', protect, getDashboardMetrics);

module.exports = router;