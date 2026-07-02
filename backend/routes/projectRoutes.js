const express = require('express');
const router = express.Router();
const { createProject, getProjects } = require('../controllers/projectController');
const { protect ,authorizeRoles} = require('../middlewares/authMiddleware');

// Har route ko protect middleware se secure kar diya gaya hai
router.route('/').post(protect,authorizeRoles('Admin'), createProject).get(protect, getProjects);
// router.route('/:id')
//   .put(protect, authorizeRoles('Admin'), updateProject)
//   .delete(protect, authorizeRoles('Admin'), deleteProject);

module.exports = router;