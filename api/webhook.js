const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = 'https://pub-3a53df11fb5549bd97511bdef51a3c33.r2.dev/';

// Beat files mapping - filename in R2
const BEAT_FILES = {
  '21 Savage X Future – Sacrifice':           '%2021%20Savage%20X%20Future%20Type%20Beat%20%20-%20Sacrifice%20135%20Bpm%20Ebm.mp3',
  '21 Savage – Nolenso':                      '21%20Savage%20Type%20Beat%20-%20Nolenso%20Cm%20132%20Bpm.mp3',
  '21 Savage Type Beat 85':                   '21%20Savage%20Type%20Beat%2085%20Bpm%20Bbm.mp3',
  'Drake – Midnight':                         'Drake%20Type%20Beat%20-%20Midnight%20-%20Rnb%20Type%20Beat%20-%20Cm%20123%20Bpm%20.mp3',
  'Drake x 21 Savage – NoFeelings':           'Drake%20x%2021%20Savage%20_%20Freestyle%20Type%20Beat%20_%20NoFeelings%20Ebmaj%20%20146%20Bpm(3).mp3',
  'Future – Legacy':                          'Future%20Type%20Beat%20-%20Legacy%20-%20Em%20137%20Bpm.mp3',
  'Future x Playboy Carti x Drake – Big Dog': 'Future%20X%20Playboy%20Carti%20x%20Drake%20Type%20Beat%20-%20Big%20Dog%20Em%20143%20Bpm(4).mp3',
  'Future x 21 Savage – Codein Rain':         'Future%20x%2021%20Savage%20Type%20Beat%20-%20Codein%20Rain%20Cm%20136%20Bpm.mp3',
  'Future x Southside – Ski Driver':          'Future%20x%20Southsiddde%20Type%20Beat%20-%20Ski%20Driver%20Ebmaj%20135%20Bpm.mp3',
  'Ghosted':                                  'Ghosted.mp3',
  'Mixdown 2':                                'Mixdown(2).mp3',
  'Mixdown':                                  'Mixdown.mp3',
  'A$AP Rocky – Dumb Shit':                   'A%24ap%20Rocky%20Type%20Beat%20-%20Dumb%20Shit%20Cm%20130%20Bpm.mp3',
  'Florida Type Beat – Big Stepper':          'Florida%20Type%20Beat%20Big%20Stepper%20Bossman%20Dlow%20Type%20Beat%20D%23Min%20156%20BPM%20V1.mp3',
  'Larb – 21 Savage Type Beat':               'Larb%20-%2021%20Savage%20Type%20Beat%20-%20G%23%20165%20Bpm.mp3',
  'Put In My Cup – Future':                   'Put%20in%20my%20cup%20-%20Future%20Type%20Beat%20-%20Ebm%20130%20Bpm%20.mp3',
  'Roulete – 21 Savage':                      'Roulete%20%20-%2021%20Savage%20Type%20Beat%2077%20Bpm%20C%23m(2).mp3',
  'Travis Scott x Ye – Titel':               'Travis%20Scott%20x%20Ye%20Type%20Beat%20-%20Titel%20-%20Dm%20130%20Bpm.mp3',
  'DGAF – Future ft. Quavo':                  'DGAF%20-%20Future%20Ft.%20Quavo%20Type%20Beat%20Bmin%20135%20Bpm%20.mp3',
  'Darkness In My Visions':                   'Darkness%20in%20my%20Visions(3).mp3',
  'Decision – 21 Savage':                     'Decision%20-%2021%20Savage%20Type%20Beat%20D%23m%20134%20Bpm.mp3',
  'Draft Day – Future':                       'Draft%20Day%20-%20Future%20Type%20Beat%20Abm%20140%20Bpm(2).mp3',
};

const LICENSE_NAMES = {
  mp3:       'MP3 Lease',
  wav:       'WAV Lease',
  trackout:  'Trackout Lease',
  exclusive: 'Exclusive Rights',
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { beatName, license } = session.metadata;
    const customerEmail = session.customer_details.email;
    const customerName = session.customer_details.name || 'Artist';

    // Get download URL
    const fileKey = BEAT_FILES[beatName];
    const downloadUrl = fileKey ? BASE_URL + fileKey : null;
    const licenseName = LICENSE_NAMES[license] || license;

    console.log(`Order: ${beatName} | ${licenseName} | ${customerEmail}`);

    if (!downloadUrl) {
      console.error('Beat file not found:', beatName);
    }

    try {
      await resend.emails.send({
        from: 'Deadshot Beats <noreply@deadshotbeats.com>',
        to: customerEmail,
        subject: `Your Beat is Ready — ${beatName} 🔥`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;max-width:560px;width:100%;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#080808;padding:28px 40px;border-bottom:2px solid #e01a1a;">
                      <span style="font-family:Georgia,serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#f0f0f0;">DEAD</span><span style="font-family:Georgia,serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#e01a1a;">SHOT</span><span style="font-family:Georgia,serif;font-size:26px;font-weight:900;letter-spacing:6px;color:#f0f0f0;"> BEATS</span>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="color:#888;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Order Confirmed</p>
                      <h1 style="color:#f0f0f0;font-size:28px;margin:0 0 24px;line-height:1.2;">Your beat is ready, ${customerName}! 🔥</h1>
                      
                      <!-- Beat Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-left:3px solid #e01a1a;margin-bottom:32px;">
                        <tr>
                          <td style="padding:20px 24px;">
                            <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Beat</p>
                            <p style="color:#f0f0f0;font-size:18px;font-weight:700;margin:0 0 16px;">${beatName}</p>
                            <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">License</p>
                            <p style="color:#e01a1a;font-size:15px;font-weight:600;margin:0;">${licenseName}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Download Button -->
                      ${downloadUrl ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                        <tr>
                          <td align="center">
                            <a href="${downloadUrl}" style="display:inline-block;background:#e01a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:16px 40px;">
                              ↓ DOWNLOAD BEAT
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color:#555;font-size:12px;text-align:center;margin:0 0 32px;">
                        Or copy this link: <a href="${downloadUrl}" style="color:#e01a1a;">${downloadUrl}</a>
                      </p>
                      ` : `
                      <p style="color:#888;font-size:14px;margin:0 0 32px;">Your download link will be sent shortly. If you don't receive it within 24h, please contact us.</p>
                      `}

                      <!-- License Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #222;padding-top:24px;margin-bottom:24px;">
                        <tr><td style="padding-top:24px;">
                          <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">License Terms</p>
                          ${license === 'mp3' ? `
                            <p style="color:#555;font-size:13px;line-height:1.8;margin:0;">✓ MP3 High Quality (320kbps)<br>✓ Up to 100,000 Streams<br>✓ Music videos allowed<br>✓ Non-profit performances</p>
                          ` : license === 'wav' ? `
                            <p style="color:#555;font-size:13px;line-height:1.8;margin:0;">✓ WAV + MP3 Studio Quality<br>✓ Up to 500,000 Streams<br>✓ Music videos allowed<br>✓ Commercial performances<br>✓ Radio broadcasts</p>
                          ` : license === 'trackout' ? `
                            <p style="color:#555;font-size:13px;line-height:1.8;margin:0;">✓ All Stems / Individual Tracks<br>✓ WAV + MP3 included<br>✓ Unlimited Streams<br>✓ Full commercial use<br>✓ TV & Film Sync</p>
                          ` : `
                            <p style="color:#555;font-size:13px;line-height:1.8;margin:0;">✓ 100% Exclusive Rights<br>✓ Beat removed from store<br>✓ All stems & file formats<br>✓ Full commercial use<br>✓ Label deals possible</p>
                          `}
                        </td></tr>
                      </table>

                      <p style="color:#555;font-size:13px;line-height:1.7;margin:0;">
                        Questions? Reply to this email or reach out on Instagram <a href="https://instagram.com/deadshotbeats" style="color:#e01a1a;">@deadshotbeats</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#080808;padding:20px 40px;border-top:1px solid #222;">
                      <p style="color:#333;font-size:11px;margin:0;text-align:center;">© 2026 DeadshotBeats · deadshotbeats.com</p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      });
      console.log('Email sent to:', customerEmail);
    } catch (mailError) {
      console.error('Email error:', mailError);
    }
  }

  res.status(200).json({ received: true });
};
