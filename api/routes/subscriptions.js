const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { getUserTier, TIER_FEATURES } = require('../middleware/featureGate');

const router = express.Router();

// GET /api/subscriptions/status — get current user's subscription status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const tier = await getUserTier(req.user.id);
    res.json({
      tier,
      features: TIER_FEATURES[tier] || TIER_FEATURES.free,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// GET /api/subscriptions/plans — list available plans
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          'Browse all prospects',
          'View counting stats + YPRR',
          'Join discussions',
          '2 draft boards',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 4.99,
        interval: 'month',
        features: [
          'Everything in Free',
          'Unlimited draft boards',
          'Share boards with links',
          'Advanced stat comparisons',
          'Export data',
          'Priority support',
        ],
      },
    ],
  });
});

// POST /api/subscriptions/checkout — create Stripe checkout session
// TODO: Implement with Stripe SDK when ready
router.post('/checkout', requireAuth, async (req, res) => {
  const { planId } = req.body;

  if (planId !== 'pro') {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  // Placeholder — will integrate Stripe here
  // For now, return a message indicating Stripe isn't configured yet
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({
      error: 'Payments not yet configured',
      message: 'Stripe integration coming soon',
    });
  }

  // When Stripe is configured:
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({ ... });
  // res.json({ url: session.url });

  res.status(501).json({ message: 'Stripe integration pending' });
});

// POST /api/subscriptions/webhook — Stripe webhook handler
// TODO: Implement when Stripe is configured
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Placeholder for Stripe webhook
  res.json({ received: true });
});

module.exports = router;
