const express = require('express');
const router = express.Router();
const { createProject, getProjects } = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

// Har route ko protect middleware se secure kar diya gaya hai
router.route('/').post(protect, createProject).get(protect, getProjects);

module.exports = router;