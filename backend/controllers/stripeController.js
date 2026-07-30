const Stripe = require('stripe');
const Organization = require('../models/Organization');

// Initialize Stripe with your secret key from .env
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// 1. Generate Checkout Session for Frontend
exports.createCheckoutSession = async (req, res) => {
  try {
    const { planName } = req.body;
    const organizationId = req.user.organizationId;

    // Define pricing and limits based on selected plan
    let priceId = '';
    if (planName === 'pro') {
      priceId = process.env.STRIPE_PRO_PRICE_ID; 
    } else if (planName === 'enterprise') {
      priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;
    } else {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // We pass the organization ID here so the webhook knows who paid
      client_reference_id: organizationId.toString(),
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
};

// 2. Webhook to automatically upgrade/downgrade users
exports.stripeWebhook = async (req, res) => {
  console.log("🔥 [WEBHOOK] ROUTE HIT! Request received...");
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify request came from actual Stripe servers using the raw body
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`✅ [WEBHOOK] Signature Verified! Event Type: ${event.type}`);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout (UPGRADE)
 if (event.type === 'checkout.session.completed') {
    console.log("🎯 [WEBHOOK] Checkout Completed! Database update starting...");
    const session = event.data.object;
    const organizationId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    console.log("👉 Organization ID received:", organizationId);

    try {
      const organization = await Organization.findById(organizationId);
      
      if (organization) {
        let priceId = '';
        let currentPeriodEnd = null;

        // Safely retrieve subscription details from Stripe
        if (subscriptionId) {
          try {
            const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
            // Get the price ID directly from the subscription item
            priceId = subscriptionDetails.items.data[0]?.price?.id;
            currentPeriodEnd = new Date(subscriptionDetails.current_period_end * 1000);
          } catch (subErr) {
            console.error("⚠️ Warning: Could not fetch subscription details from Stripe.", subErr.message);
            currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days fallback
          }
        }

        console.log("👉 Price ID received:", priceId);
        
        let newPlan = 'free';
        let newMaxUsers = 5;
        let newMaxProjects = 3;

        // Match with your environment variables
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) { 
          newPlan = 'pro';
          newMaxUsers = 25;
          newMaxProjects = 15;
        } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
          newPlan = 'enterprise';
          newMaxUsers = 999;
          newMaxProjects = 999;
        }

        // Update Database Automatically
        organization.subscriptionPlan = newPlan;
        organization.maxUsers = newMaxUsers;
        organization.maxProjects = newMaxProjects;
        organization.stripeCustomerId = customerId;
        organization.stripeSubscriptionId = subscriptionId;
        organization.expiresAt = currentPeriodEnd; 
        
        await organization.save();
        console.log(`✅ Organization ${organization.name} upgraded to ${newPlan} successfully via Webhook.`);
      } else {
        console.error("❌ [WEBHOOK ERROR] Organization not found in DB for ID:", organizationId);
      }
    } catch (dbError) {
      console.error('Error updating organization after payment:', dbError);
    }
  } 
  
  // 👉 NEW: Handle subscription cancellation or expiration (DOWNGRADE)
  else if (event.type === 'customer.subscription.deleted') {
    console.log("⚠️ [WEBHOOK] Subscription Deleted/Expired! Downgrading to Free...");
    const subscription = event.data.object;
    const customerId = subscription.customer;

    try {
      // Find the organization by the Stripe Customer ID
      const organization = await Organization.findOne({ stripeCustomerId: customerId });

      if (organization) {
        // Downgrade limits back to Free Plan
        organization.subscriptionPlan = 'free';
        organization.maxUsers = 5;
        organization.maxProjects = 3;
        organization.stripeSubscriptionId = null; // Clear active subscription ID

        await organization.save();
        console.log(`📉 [WEBHOOK] Organization ${organization.name} downgraded to FREE successfully.`);
      } else {
        console.error("❌ [WEBHOOK ERROR] Organization not found for customer ID:", customerId);
      }
    } catch (dbError) {
      console.error('Error downgrading organization:', dbError);
    }
  } 
  
  else {
    console.log(`ℹ️ [WEBHOOK] Ignored Event: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// 3. Cancel Active Subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const organization = await Organization.findById(organizationId);

    if (!organization || !organization.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active premium subscription found." });
    }

    
    await stripe.subscriptions.cancel(organization.stripeSubscriptionId);    
    res.status(200).json({ message: "Subscription cancelled successfully. You are now on the Free plan." });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Failed to cancel subscription. Please try again." });
  }
};// 3. Cancel Active Subscription (Bulletproof Version)
exports.cancelSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const organization = await Organization.findById(organizationId);

    if (!organization || !organization.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active premium subscription found in Database." });
    }

    console.log(`Attempting to cancel Stripe Subscription ID: ${organization.stripeSubscriptionId}`);

    try {
      // Attempt to cancel in Stripe
      await stripe.subscriptions.cancel(organization.stripeSubscriptionId);
      console.log("✅ Successfully cancelled in Stripe.");
    } catch (stripeErr) {
      console.error("⚠️ Stripe API Error during cancellation:", stripeErr.message);
      
      // Agar Stripe kahe ke subscription pehle hi delete ho chuki hai ya nahi mili (Test Mode issue)
      // Toh hum code ko crash nahi hone denge, balke DB update kar denge.
      if (stripeErr.code === 'resource_missing' || stripeErr.message.includes('No such subscription')) {
         console.log("ℹ️ Subscription already missing in Stripe. Forcing local DB downgrade to free up the user.");
      } else {
         // Agar koi aur masla (like network issue) hai, toh error throw karein
         throw stripeErr; 
      }
    }

    // Force DB downgrade immediately
    organization.subscriptionPlan = 'free';
    organization.maxUsers = 5;
    organization.maxProjects = 3;
    organization.stripeSubscriptionId = null; // Clear the ghost ID
    
    await organization.save();

    res.status(200).json({ message: "Subscription cancelled successfully. You are now on the Free plan." });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    // Error message frontend par bhejain taake user ko exact masla nazar aaye
    res.status(500).json({ message: `Failed to cancel: ${error.message}` });
  }
};