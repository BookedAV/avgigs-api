// api/charge-fill.js
// Vercel serverless function — charges the $25 introduction fee
// Called when a client clicks "Mark Filled" on their dashboard.
// Uses the saved payment method (from SetupIntent) to create a PaymentIntent and charge.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Introduction fee in cents ($25.00 = 2500 cents)
const INTRO_FEE_CENTS = 2500;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: lock to your domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { job_id, customer_id } = req.body;

    if (!job_id || !customer_id) {
      return res.status(400).json({ error: 'job_id and customer_id required' });
    }

    // 1. Get the customer's default payment method
    const customer = await stripe.customers.retrieve(customer_id);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: 'card',
      limit: 1
    });

    if (paymentMethods.data.length === 0) {
      return res.status(400).json({ error: 'No payment method on file. Add a card first.' });
    }

    const paymentMethodId = paymentMethods.data[0].id;

    // 2. Create a PaymentIntent and confirm it immediately (off-session charge)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: INTRO_FEE_CENTS,
      currency: 'usd',
      customer: customer_id,
      payment_method: paymentMethodId,
      off_session: true,       // Charging without the user present in Stripe UI
      confirm: true,           // Confirm immediately
      description: `AVGigs introduction fee — Job ${job_id}`,
      metadata: {
        job_id,
        fee_type: 'introduction'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      return res.status(200).json({
        success: true,
        payment_intent_id: paymentIntent.id,
        amount: INTRO_FEE_CENTS
      });
    } else {
      return res.status(400).json({
        error: `Payment status: ${paymentIntent.status}. Card may require authentication.`
      });
    }

  } catch (err) {
    console.error('charge-fill error:', err);

    // Handle specific Stripe errors
    if (err.type === 'StripeCardError') {
      return res.status(400).json({ error: `Card declined: ${err.message}` });
    }

    return res.status(500).json({ error: err.message });
  }
};
