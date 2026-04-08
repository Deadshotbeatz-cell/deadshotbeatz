const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Hier wird geprüft, ob die Nachricht wirklich echt von Stripe kommt
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Wenn die Zahlung erfolgreich abgeschlossen wurde
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const customerEmail = session.customer_details.email;
      const beatName = session.metadata.beatName; // Falls du Metadaten übergibst

      console.log(`ZAHLUNG ERFOLGREICH: Sende Beat ${beatName} an ${customerEmail}`);

      // HIER kommt dein Mail-Versand-Code rein (z.B. mit Resend oder Nodemailer)
      // await sendEmail(customerEmail, beatName);
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
