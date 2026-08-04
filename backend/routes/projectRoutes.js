const express = require('express');
const router = express.Router();
const { createProject, getProjects, deleteProject ,updateProject} = require('../controllers/projectController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/').post(protect, authorizeRoles('Org Admin', 'Project Manager'), createProject).get(protect, getProjects);
router.route('/:id').put(protect, authorizeRoles('Org Admin', 'Project Manager'), updateProject).delete(protect, authorizeRoles('Org Admin', 'Project Manager'), deleteProject);

module.exports = router;