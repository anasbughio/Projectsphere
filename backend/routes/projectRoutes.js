const express = require('express');
const router = express.Router();
const { createProject, getProjects, deleteProject ,updateProject} = require('../controllers/projectController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/').post(protect, authorizeRoles('Admin', 'Project Manager'), createProject).get(protect, getProjects);
router.route('/:id').put(protect, updateProject).delete(protect, authorizeRoles('Admin'), deleteProject);

module.exports = router;