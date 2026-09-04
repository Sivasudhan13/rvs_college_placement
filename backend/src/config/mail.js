const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Returns a cached Nodemailer transporter.
 * Re-creates if env vars changed (e.g. dotenv reload).
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST     || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  console.log(`[MAIL CONFIG] host=${host} port=${port} user=${user}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,          // true for 465, false for 587 (STARTTLS)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,   // allow self-signed certs in dev
    },
    // Increase timeouts for slow SMTP servers
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  });

  return transporter;
};

/**
 * Call this at startup to verify SMTP is reachable.
 * Logs result but does NOT crash the server on failure.
 */
const verifyMailConfig = async () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || user === 'your_email@gmail.com' || !pass || pass === 'your_app_password') {
    console.warn('[MAIL] SMTP not configured — emails will be skipped until .env is set.');
    return false;
  }

  try {
    const t = getTransporter();
    await t.verify();
    console.log('[MAIL] ✓ SMTP connection verified successfully');
    return true;
  } catch (err) {
    console.error('[MAIL] ✗ SMTP verification failed:', err.message);
    if (err.message.includes('535') || err.message.includes('534')) {
      console.error('[MAIL] → Fix: Use a Gmail App Password, NOT your regular Gmail password.');
      console.error('[MAIL] → Steps: Google Account → Security → 2-Step Verification ON → App Passwords → Mail → Copy 16-char password into SMTP_PASSWORD in .env');
    }
    // Reset so next call retries
    transporter = null;
    return false;
  }
};

module.exports = { getTransporter, verifyMailConfig };
