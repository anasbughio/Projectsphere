const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/stripeController');
const { protect } = require('../middlewares/authMiddleware');

// Route for the frontend to request a payment screen
router.post('/create-checkout-session', protect, createCheckoutSession);

// Route for Stripe servers to talk to our backend (No 'protect' middleware here!)
router.post('/', stripeWebhook);

module.exports = router;