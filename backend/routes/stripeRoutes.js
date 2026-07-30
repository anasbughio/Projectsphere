const express = require('express');
const router = express.Router();
const { createCheckoutSession, cancelSubscription } = require('../controllers/stripeController');
const { protect } = require('../middlewares/authMiddleware');

// Route for the frontend to request a payment screen
router.post('/create-checkout-session', protect, createCheckoutSession);

// Route for cancelling subscription
router.post('/cancel-subscription', protect, cancelSubscription);

module.exports = router;