// api/create-setup-intent.js
// Vercel serverless function — creates a Stripe customer + SetupIntent
// The client_secret is returned so Stripe.js can confirm the card on the frontend.
// The Stripe SECRET key stays here on the server. Never on the frontend.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers (allow your GitHub Pages domain)
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: lock to your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, email, customer_id } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: 'user_id and email required' });
    }

    // Create or reuse Stripe customer
    let customerId = customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user_id }
      });
      customerId = customer.id;
    }

    // Create SetupIntent (this is how you save a card WITHOUT charging)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: { supabase_user_id: user_id }
    });

    return res.status(200).json({
      client_secret: setupIntent.client_secret,
      customer_id: customerId
    });

  } catch (err) {
    console.error('create-setup-intent error:', err);
    return res.status(500).json({ error: err.message });
  }
};
