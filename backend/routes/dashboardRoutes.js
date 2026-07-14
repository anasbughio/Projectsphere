const express = require('express');
const router = express.Router();
const { getDashboardMetrics ,getSuperAdminMetrics} = require('../controllers/dashboardController');
const { protect ,authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/metrics', protect, getDashboardMetrics);
router.get('/platform-stats', protect, authorizeRoles('Super Admin'), getSuperAdminMetrics);

module.exports = router;