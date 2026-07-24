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

// 2. Webhook to automatically upgrade users upon successful payment
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify request came from actual Stripe servers using the raw body
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout
if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const organizationId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    try {
      const organization = await Organization.findById(organizationId);
      
      if (organization) {
        // Stripe se line items fetch karein taake exact price ID pata chal jaye
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        let newPlan = 'free';
        let newMaxUsers = 5;
        let newMaxProjects = 3;

        // Match with your environment variables or direct Price IDs
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
        
        await organization.save();
        console.log(`Organization ${organization.name} upgraded to ${newPlan} successfully via Webhook.`);
      }
    } catch (dbError) {
      console.error('Error updating organization after payment:', dbError);
    }
  }
  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};