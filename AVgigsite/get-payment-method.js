// api/get-payment-method.js
// Returns card brand and last4 digits for display purposes.
// This avoids exposing the full payment method object to the frontend.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { payment_method_id } = req.body;

    if (!payment_method_id) {
      return res.status(400).json({ error: 'payment_method_id required' });
    }

    const pm = await stripe.paymentMethods.retrieve(payment_method_id);

    return res.status(200).json({
      brand: pm.card?.brand || null,
      last4: pm.card?.last4 || null
    });

  } catch (err) {
    console.error('get-payment-method error:', err);
    return res.status(500).json({ error: err.message });
  }
};
