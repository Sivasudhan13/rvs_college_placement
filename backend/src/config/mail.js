const nodemailer = require('nodemailer');
const dns        = require('dns');

// Force Node.js to prefer IPv4 — Render free tier blocks outbound IPv6 SMTP
dns.setDefaultResultOrder('ipv4first');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Use port 465 (SSL) in production — Render blocks 587 (STARTTLS) on free tier
  // Use port 587 in development (local machine has no restriction)
  const port   = process.env.NODE_ENV === 'production' ? 465 : (parseInt(process.env.SMTP_PORT) || 587);
  const secure = port === 465;

  console.log(`[MAIL CONFIG] host=${host} port=${port} secure=${secure} user=${user}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    // Family 4 = IPv4 only — bypasses Render's IPv6 ENETUNREACH error
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout:   10000,
    socketTimeout:     20000,
  });

  return transporter;
};

const verifyMailConfig = async () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || user === 'your_email@gmail.com' || !pass || pass === 'your_app_password') {
    console.warn('[MAIL] SMTP not configured — emails will be skipped.');
    return false;
  }

  try {
    const t = getTransporter();
    await t.verify();
    console.log('[MAIL] ✓ SMTP connection verified successfully');
    return true;
  } catch (err) {
    console.error('[MAIL] ✗ SMTP verification failed:', err.message);
    if (err.message.includes('ENETUNREACH') || err.message.includes('ECONNREFUSED')) {
      console.error('[MAIL] → Render free tier may block outbound SMTP.');
      console.error('[MAIL] → Trying alternative: ensure SMTP_PORT=465 is set on Render.');
    }
    if (err.message.includes('535') || err.message.includes('534')) {
      console.error('[MAIL] → Wrong Gmail credentials. Use a Gmail App Password.');
    }
    transporter = null;
    return false;
  }
};

module.exports = { getTransporter, verifyMailConfig };
