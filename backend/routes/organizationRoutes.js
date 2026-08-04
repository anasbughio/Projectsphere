// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createOrganization, 
  getAllOrganizations, 
  updateOrganization, 
  toggleOrganizationStatus,
  deleteOrganization ,
  updateCustomFields,
  getCustomFields
} = require('../controllers/organizationController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Lock all routes in this file to Super Admin only
router.use(protect);
// router.use(authorizeRoles('Super Admin'));

router.route('/')
  .post(createOrganization)
  .get(getAllOrganizations);
  
  router.route('/fields').get(protect, getCustomFields);
  router.route('/fields').put(protect, updateCustomFields);

  router.route('/:id')
  .put(updateOrganization)
  .delete(deleteOrganization);

  router.route('/:id/status').patch(toggleOrganizationStatus);


module.exports = router;