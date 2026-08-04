const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getTeamWorkload } = require('../controllers/workloadController');

router.get('/', protect, getTeamWorkload);

module.exports = router;