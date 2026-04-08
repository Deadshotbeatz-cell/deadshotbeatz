const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Vercel braucht das, um den rohen Stripe-Body zu lesen
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // HIER passiert die Magie: E-Mail versenden
      try {
        await resend.emails.send({
          from: 'Deadshot Beats <onboarding@resend.dev>', // Behalte das erst mal so
          to: session.customer_details.email,
          subject: 'Dein Beat-Download ist da! 🔥',
          html: `
            <div style="font-family: sans-serif; background: #080808; color: white; padding: 20px;">
              <h1 style="color: #e01a1a;">DEADSHOT BEATS</h1>
              <p>Vielen Dank für dein Vertrauen!</p>
              <p>Du kannst deinen Beat über den folgenden Link herunterladen:</p>
              <a href="DEIN_DOWNLOAD_LINK" style="background: #e01a1a; color: white; padding: 10px 20px; text-decoration: none;">DOWNLOAD STARTEN</a>
              <p style="margin-top: 20px; color: #888;">Bei Problemen antworte einfach auf diese Mail.</p>
            </div>
          `,
        });
        console.log("Email erfolgreich versendet!");
      } catch (mailError) {
        console.error("Fehler beim Mail-Versand:", mailError);
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
