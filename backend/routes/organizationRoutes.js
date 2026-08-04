// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createOrganization, 
  getAllOrganizations, 
  updateOrganization, 
  toggleOrganizationStatus,
  deleteOrganization 
} = require('../controllers/organizationController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Lock all routes in this file to Super Admin only
router.use(protect);
router.use(authorizeRoles('Super Admin'));

router.route('/')
  .post(createOrganization)
  .get(getAllOrganizations);

router.route('/:id')
  .put(updateOrganization)
  .delete(deleteOrganization);

router.route('/:id/status').patch(toggleOrganizationStatus);

module.exports = router;