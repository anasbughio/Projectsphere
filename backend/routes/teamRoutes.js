const express = require('express');
const router = express.Router();
const { getTeamMembers } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getTeamMembers);

module.exports = router;