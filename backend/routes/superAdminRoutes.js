const express = require('express');
const router = express.Router();
const { getTenantSubscriptions, updateTenantSubscription } = require('../controllers/superAdminController');
const { protect } = require('../middlewares/authMiddleware'); // Ensure Super Admin auth

router.get('/subscriptions', protect, getTenantSubscriptions);
router.put('/subscriptions/:tenantId', protect, updateTenantSubscription);

module.exports = router;