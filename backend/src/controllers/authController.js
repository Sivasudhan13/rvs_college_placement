const User         = require('../models/User');
const sendToken    = require('../utils/sendToken');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendWelcomeEmail } = require('../services/emailService');

/* ─────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────── */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, studentId, admissionNumber, department, password, batch } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { studentId }] });
  if (existing) {
    return next(new ApiError('Email or Student ID already registered', 400));
  }

  const user = await User.create({
    name, email, studentId, admissionNumber,
    department, password, batch: batch || '',
  });

  // Send welcome email — non-blocking, never fails the registration
  sendWelcomeEmail(user).catch((err) =>
    console.error('[EMAIL] Welcome email failed for', user.email, ':', err.message)
  );

  sendToken(user, 201, res);
});

/* ─────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────── */
exports.login = asyncHandler(async (req, res, next) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return next(new ApiError('Please provide Student ID and password', 400));
  }

  // Select password explicitly (select:false in schema)
  const user = await User.findOne({ studentId }).select('+password');
  if (!user) {
    return next(new ApiError('Invalid credentials', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ApiError('Invalid credentials', 401));
  }

  user.lastLogin = Date.now();
  await user.updateOne({ lastLogin: user.lastLogin }); // bypass pre-save hook

  sendToken(user, 200, res);
});

/* ─────────────────────────────────────────
   GET /api/auth/me   (protected)
───────────────────────────────────────── */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});

/* ─────────────────────────────────────────
   PUT /api/auth/me   (protected)
───────────────────────────────────────── */
exports.updateMe = asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'email', 'department', 'bio', 'avatar'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true, runValidators: true,
  });

  res.status(200).json({ success: true, user });
});

/* ─────────────────────────────────────────
   PUT /api/auth/change-password  (protected)
───────────────────────────────────────── */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res);
});

/* ─────────────────────────────────────────
   POST /api/auth/logout  (protected)
───────────────────────────────────────── */
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires:  new Date(Date.now() + 5000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/* ─────────────────────────────────────────
   POST /api/auth/forgot-password
   Generic response to prevent email enumeration
───────────────────────────────────────── */
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const GENERIC = 'If an account exists for this email, a reset link has been sent.';

  const user = await User.findOne({ email: email?.toLowerCase?.() });
  if (!user) {
    // Generic response — do not reveal whether email exists
    return res.status(200).json({ success: true, message: GENERIC });
  }

  // Generate raw token and hash it for storage
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const hashed    = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken  = hashed;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user, resetUrl);
  } catch {
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: GENERIC });
});

/* ─────────────────────────────────────────
   POST /api/auth/reset-password/:token
───────────────────────────────────────── */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (!password || password.length < 8) {
    return next(new ApiError('Password must be at least 8 characters', 400));
  }
  if (password !== confirmPassword) {
    return next(new ApiError('Passwords do not match', 400));
  }

  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Invalid or expired reset token', 400));
  }

  user.password            = password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
});
