console.log("Check Key:", process.env.STRIPE_SECRET_KEY ? "Key ist da" : "Key ist LEER");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const LICENSE_PRICES = { mp3:0000, wav:5900, trackout:9900, exclusive:49900 };
const LICENSE_NAMES  = { mp3:'MP3 Lease', wav:'WAV Lease', trackout:'Trackout Lease', exclusive:'Exclusive Rights' };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { beatName, beatId, license } = req.body;
    if (!beatName || !license || !LICENSE_PRICES[license])
      return res.status(400).json({ error: 'Ungültige Anfrage' });

    const origin = req.headers.origin || 'https://deadshotbeats.com';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: beatName, description: LICENSE_NAMES[license] + ' — DeadshotBeats' },
          unit_amount: LICENSE_PRICES[license],
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/success.html?beat=${encodeURIComponent(beatName)}&license=${license}`,
      cancel_url:  `${origin}/#beats`,
      metadata: { beatId: String(beatId), beatName, license },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Checkout konnte nicht erstellt werden.' });
  }
};
