const express = require('express');
const router = express.Router();
const { getDashboardMetrics ,getSuperAdminMetrics, getAuditLogs } = require('../controllers/dashboardController');
const { protect ,authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/metrics', protect, getDashboardMetrics);
router.get('/platform-stats', protect, authorizeRoles('Super Admin'), getSuperAdminMetrics);
router.get('/audit-logs', protect, authorizeRoles('Super Admin'), getAuditLogs);

module.exports = router;