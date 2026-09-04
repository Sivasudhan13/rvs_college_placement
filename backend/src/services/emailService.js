const { getTransporter } = require('../config/mail');

const FROM = process.env.MAIL_FROM || 'RVSCET Portal <noreply@rvscet.ac.in>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/* ── base HTML wrapper ── */
const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>RVSCET Portal</title>
  <style>
    body{margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;}
    .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08);}
    .header{background:#0c5273;padding:24px 32px;text-align:center;}
    .header h1{margin:0;color:#fff;font-size:20px;letter-spacing:.5px;}
    .header p{margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px;}
    .body{padding:32px;}
    .btn{display:inline-block;background:#0c5273;color:#fff!important;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:20px 0;}
    .card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:16px 0;}
    .footer{background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;}
    h2{margin:0 0 8px;font-size:22px;color:#0c5273;}
    p{line-height:1.7;margin:8px 0;font-size:14px;}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>RVS College of Engineering &amp; Technology</h1>
      <p>Academic Portal — Training &amp; Placement</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} RVSCET. All rights reserved.<br/>
      This is an automated message — please do not reply directly.
    </div>
  </div>
</body>
</html>`;

/* ── send helper ── */
const send = async ({ to, subject, html }) => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Guard: skip silently only if placeholder not replaced
  if (!user || user === 'your_email@gmail.com') {
    console.warn('[EMAIL SKIP] SMTP_USER not configured — set it in .env');
    return;
  }
  if (!pass || pass === 'your_app_password') {
    console.warn('[EMAIL SKIP] SMTP_PASSWORD not configured — set it in .env');
    return;
  }

  console.log(`[EMAIL] Attempting to send "${subject}" → ${to}`);
  console.log(`[EMAIL] SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${user}`);

  try {
    const t = getTransporter();

    // Verify connection before first send (cached after that)
    if (!t._verified) {
      await t.verify();
      t._verified = true;
      console.log('[EMAIL] SMTP connection verified ✓');
    }

    const info = await t.sendMail({ from: FROM, to, subject, html });
    console.log(`[EMAIL] ✓ Sent to ${to} | messageId: ${info.messageId}`);
  } catch (err) {
    console.error('[EMAIL] ✗ Send failed:', err.message);
    // Common error hints
    if (err.message.includes('535') || err.message.includes('Username and Password')) {
      console.error('[EMAIL] HINT: Gmail credentials wrong. Use an App Password (not your Gmail login password).');
      console.error('[EMAIL] HINT: Enable 2FA → https://myaccount.google.com/security → App Passwords → Generate one for "Mail"');
    }
    if (err.message.includes('534') || err.message.includes('less secure')) {
      console.error('[EMAIL] HINT: Gmail blocked the sign-in. Use App Password instead of your account password.');
    }
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      console.error('[EMAIL] HINT: Cannot reach SMTP server. Check SMTP_HOST / SMTP_PORT or firewall.');
    }
    throw err; // re-throw so callers can catch it
  }
};

/* ══════════════════════════════════════
   TEMPLATES
══════════════════════════════════════ */

exports.sendWelcomeEmail = async (user) => {
  const html = wrap(`
    <h2>Welcome to RVSCET Portal! 🎉</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Your student account has been successfully created. You can now access all training, placement, and assessment resources.</p>
    <div class="card">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Student ID:</strong> ${user.studentId}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Department:</strong> ${user.department?.toUpperCase()}</p>
    </div>
    <a class="btn" href="${CLIENT_URL}/login">Login to Portal →</a>
    <p style="color:#6b7280;font-size:12px;margin-top:16px;">For security, your password is not included in this email.</p>
  `);
  await send({ to: user.email, subject: 'Welcome to RVSCET Academic Portal', html });
};

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  const html = wrap(`
    <h2>Password Reset Request 🔐</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We received a request to reset your RVSCET Portal password. Click the button below to create a new password.</p>
    <a class="btn" href="${resetUrl}">Reset My Password</a>
    <div class="card">
      <p>⏳ <strong>This link expires in 15 minutes.</strong></p>
      <p>If you did not request a password reset, please ignore this email. Your account is safe.</p>
    </div>
    <p style="color:#6b7280;font-size:12px;">Or copy and paste this URL: ${resetUrl}</p>
  `);
  await send({ to: user.email, subject: 'Reset Your RVSCET Portal Password', html });
};

exports.sendMockTestNotification = async (user, test) => {
  const html = wrap(`
    <h2>New Mock Test Available 📝</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>A new mock test has been published and is now available for you.</p>
    <div class="card">
      <p><strong>Test:</strong> ${test.title}</p>
      <p><strong>Category:</strong> ${test.category}</p>
      <p><strong>Questions:</strong> ${test.totalQuestions}</p>
      <p><strong>Duration:</strong> ${test.duration} minutes</p>
      ${test.endDate ? `<p><strong>Available Until:</strong> ${new Date(test.endDate).toLocaleDateString()}</p>` : ''}
    </div>
    <a class="btn" href="${CLIENT_URL}/student/mock-tests/${test._id}">Start Test →</a>
  `);
  await send({ to: user.email, subject: `New Mock Test: ${test.title}`, html });
};

exports.sendPlacementNotification = async (user, drive) => {
  const html = wrap(`
    <h2>Placement Drive Invitation 🏢</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>You have been invited to a placement drive. Please review the details below.</p>
    <div class="card">
      <p><strong>Company:</strong> ${drive.company?.name || drive.company}</p>
      <p><strong>Role:</strong> ${drive.jobRole || 'TBD'}</p>
      <p><strong>Package:</strong> ${drive.packageLPA ? `₹${drive.packageLPA} LPA` : 'TBD'}</p>
      ${drive.driveDate ? `<p><strong>Date:</strong> ${new Date(drive.driveDate).toLocaleDateString()}</p>` : ''}
    </div>
    <a class="btn" href="${CLIENT_URL}/placement/drives/${drive._id}">View Drive Details →</a>
  `);
  await send({ to: user.email, subject: `Placement Drive Invitation — ${drive.company?.name || 'Company'}`, html });
};

exports.sendAttendanceAbsentEmail = async (user, trainingTitle, date) => {
  const html = wrap(`
    <h2>Attendance Marked Absent ⚠️</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>You have been marked <strong style="color:#ef4444;">Absent</strong> for the following training session.</p>
    <div class="card">
      <p><strong>Training:</strong> ${trainingTitle}</p>
      <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
    </div>
    <p>If this is incorrect, please contact your trainer or department coordinator.</p>
    <a class="btn" href="${CLIENT_URL}/attendance">View Attendance →</a>
  `);
  await send({ to: user.email, subject: `Attendance Marked Absent — ${trainingTitle}`, html });
};

exports.sendGeneralNotification = async (user, { title, message, actionUrl }) => {
  const html = wrap(`
    <h2>${title}</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>${message}</p>
    ${actionUrl ? `<a class="btn" href="${CLIENT_URL}${actionUrl}">View Details →</a>` : ''}
  `);
  await send({ to: user.email, subject: `RVSCET Portal: ${title}`, html });
};
