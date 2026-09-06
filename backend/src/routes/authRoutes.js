const router   = require('express').Router();
const { body } = require('express-validator');
const {
  register, login, getMe, updateMe, changePassword, logout,
  forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

// Validators
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail({ allow_utf8_local_part: false })
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
    .withMessage('Valid email required'),
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phoneNumber').optional().matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number'),
  body('department').optional().isIn(['cse','ece','eee','me','ce','it','mca','mba','other']),
];

const loginRules = [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
// logout works with or without a valid token — clears the cookie either way
router.post('/logout',   logout);
router.get ('/me',       protect, getMe);
router.put ('/me',       protect, updateMe);
router.put ('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, changePassword);

/* ── Forgot / Reset password ── */
router.post('/forgot-password', [
  body('email').isEmail({ allow_utf8_local_part: false }).normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }).withMessage('Valid email required'),
], validate, forgotPassword);

router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, resetPassword);

module.exports = router;
