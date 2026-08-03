const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createMeeting, getClientCalendarData } = require('../controllers/meetingController');

// Meetings create route
router.post('/', protect, createMeeting);
router.get('/calendar-data', protect, getClientCalendarData);

module.exports = router;