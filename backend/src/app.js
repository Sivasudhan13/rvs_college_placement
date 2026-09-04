require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const { verifyMailConfig } = require('./config/mail');

// Route files
const authRoutes      = require('./routes/authRoutes');
const quizRoutes      = require('./routes/quizRoutes');
const taskRoutes      = require('./routes/taskRoutes');
const roadmapRoutes   = require('./routes/roadmapRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const dsaRoutes       = require('./routes/dsaRoutes');
const aptitudeRoutes  = require('./routes/aptitudeRoutes');
const attendanceRoutes= require('./routes/attendanceRoutes');
const placementRoutes     = require('./routes/placementRoutes');
const mockTestRoutes      = require('./routes/mockTestRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');

/* ── Connect DB ── */
connectDB();

// Verify SMTP on startup — non-blocking
verifyMailConfig();

const app = express();

// Trust Render's reverse proxy so rate-limiter reads real client IP
// (not the proxy IP which would group all users under one limit)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/* ── Security & utilities ── */
// Disable crossOriginResourcePolicy — it blocks cross-origin fetch with status null
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
  crossOriginEmbedderPolicy: false,
}));

/* ── CORS ────────────────────────────────────────────────────────────
   Allowed origins:
   • All localhost Vite dev ports
   • CLIENT_URL from .env  (your Vercel URL in production)
   • Any *.vercel.app subdomain — covers preview deployments too
──────────────────────────────────────────────────────────────────── */
const buildAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://localhost:4173',   // vite preview
  ];

  // Add CLIENT_URL (may be a comma-separated list for multiple domains)
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((u) => {
      const trimmed = u.trim();
      if (trimmed) origins.push(trimmed);
    });
  }

  return origins.filter(Boolean);
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow ALL *.vercel.app subdomains (preview + production deployments)
    if (/^https:\/\/[a-zA-Z0-9-]+(\.vercel\.app)$/.test(origin)) {
      return callback(null, true);
    }

    // Allow ALL *.onrender.com (render preview services)
    if (/^https:\/\/[a-zA-Z0-9-]+(\.onrender\.com)$/.test(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  preflightContinue:   false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for every route
app.options(/.*/, cors(corsOptions));

/* ── Rate limiting (100 req / 15 min per IP) ── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

/* ── Auth rate limit (stricter: 20 req / 15 min in dev, 10 in prod) ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

/* ── Body parsers ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ── Logger ── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RVSCET Placement Portal API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

/* ── Email test (dev only) ── */
if (process.env.NODE_ENV === 'development') {
  const { verifyMailConfig: checkMail } = require('./config/mail');
  const { sendWelcomeEmail } = require('./services/emailService');

  app.get('/api/email-test', async (req, res) => {
    const to = req.query.to;
    if (!to) return res.status(400).json({ success: false, message: 'Pass ?to=your@email.com' });

    const ok = await checkMail();
    if (!ok) {
      return res.status(500).json({
        success: false,
        message: 'SMTP connection failed — check backend console for details',
        hint: 'Make sure SMTP_USER and SMTP_PASSWORD are set in .env, and SMTP_PASSWORD is a Gmail App Password (not your login password)',
      });
    }

    try {
      await sendWelcomeEmail({ name: 'Test User', email: to, studentId: 'TEST001', department: 'cse' });
      res.json({ success: true, message: `Test welcome email sent to ${to}` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

/* ── API Routes ── */
app.use('/api/auth',      authRoutes);
app.use('/api/quizzes',   quizRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/roadmap',   roadmapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/dsa',        dsaRoutes);
app.use('/api/aptitude',   aptitudeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/placement',      placementRoutes);
app.use('/api/mock-tests',     mockTestRoutes);
app.use('/api/notifications',  notificationRoutes);

/* ── 404 handler ── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* ── Global error handler (must be last) ── */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡  API base: http://localhost:${PORT}/api`);
  console.log(`❤️   Health:  http://localhost:${PORT}/api/health\n`);
});

/* ── Graceful shutdown ── */
process.on('unhandledRejection', (err) => {
  console.error(`❌  Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
