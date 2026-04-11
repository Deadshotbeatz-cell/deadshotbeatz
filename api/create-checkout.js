const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const LICENSE_NAMES = {
  mp3:       'MP3 Lease',
  wav:       'WAV Lease',
  trackout:  'Trackout Lease',
  exclusive: 'Exclusive Rights',
};

// Fallback multipliers if no price sent from frontend
const LICENSE_MULTIPLIERS = {
  mp3:       1,
  wav:       2,
  trackout:  3.5,
  exclusive: 17,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  console.log('Checkout request:', req.body);

  try {
    const { beatName, beatId, license, price } = req.body;

    if (!beatName || !license || !LICENSE_NAMES[license]) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Use price from frontend (already calculated: base × multiplier)
    // Fallback: 29€ × multiplier if no price sent
    let finalPriceEur;
    if (price && typeof price === 'number' && price > 0) {
      finalPriceEur = Math.round(price);
    } else {
      finalPriceEur = Math.round(29 * (LICENSE_MULTIPLIERS[license] || 1));
    }

    // Stripe wants amount in cents
    const amountCents = finalPriceEur * 100;

    const origin = req.headers.origin || 'https://deadshotbeats.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: beatName,
            description: `${LICENSE_NAMES[license]} — DeadshotBeats`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/success.html?beat=${encodeURIComponent(beatName)}&license=${license}`,
      cancel_url:  `${origin}/#beats`,
      metadata: {
        beatId:   String(beatId || ''),
        beatName: String(beatName),
        license:  String(license),
        price:    String(finalPriceEur),
      },
    });

    console.log(`Checkout created: ${beatName} | ${LICENSE_NAMES[license]} | ${finalPriceEur}€`);
    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
