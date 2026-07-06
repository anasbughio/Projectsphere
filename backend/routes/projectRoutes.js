const express = require('express');
const router = express.Router();
const { createProject, getProjects, deleteProject } = require('../controllers/projectController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/').post(protect, authorizeRoles('Admin'), createProject).get(protect, getProjects);
router.route('/:id').delete(protect, authorizeRoles('Admin'), deleteProject);

module.exports = router;