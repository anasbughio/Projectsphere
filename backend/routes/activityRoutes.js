const express = require('express');
const router = express.Router();
const { getRecentActivities } = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/recent', protect, getRecentActivities);

module.exports = router;