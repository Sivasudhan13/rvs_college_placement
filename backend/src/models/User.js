const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, 'Name is required'], trim: true, maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String, required: [true, 'Email is required'], unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email'],
      lowercase: true, trim: true,
    },
    studentId: {
      type: String, required: [true, 'Student/Faculty ID is required'], unique: true, trim: true,
    },
    admissionNumber: { type: String, trim: true },
    password: {
      type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false,
    },
    department: {
      type: String,
      enum: ['cse', 'ece', 'eee', 'me', 'ce', 'other'],
      default: 'cse',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
      // e.g. "2023-2027", "2022-2026"
    },
    role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    resetPasswordToken:   String,
    resetPasswordExpire:  Date,
    // Mobile + extended profile
    mobile:    { type: String, default: '' },
    year:      { type: Number, default: null },
    section:   { type: String, default: '' },
    lastLogin: Date,
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ── Hash password before save ── */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ── Sign JWT ── */
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/* ── Compare plain password to hash ── */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
