const router = require('express').Router();
const {
  getQuestions, getQuestion, attemptQuestion,
  getTests, getTest, startTest, submitTest, getResult, getTestHistory,
  getProgress, getDailyChallenge, submitDailyChallenge,
  getLeaderboard,
} = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');

// ── Questions ──
router.get ('/questions',                protect, getQuestions);
router.get ('/questions/:id',            protect, getQuestion);
router.post('/questions/:id/attempt',    protect, attemptQuestion);

// ── Tests ──
router.get ('/tests',                    protect, getTests);
router.get ('/tests/history',            protect, getTestHistory);
router.get ('/tests/results/:attemptId', protect, getResult);
router.get ('/tests/:id',                protect, getTest);
router.post('/tests/:id/start',          protect, startTest);
router.post('/tests/:id/submit',         protect, submitTest);

// ── Progress ──
router.get ('/progress',                 protect, getProgress);

// ── Daily challenge ──
router.get ('/daily-challenge',          protect, getDailyChallenge);
router.post('/daily-challenge/submit',   protect, submitDailyChallenge);

// ── Leaderboard ──
router.get ('/leaderboard',              protect, getLeaderboard);

module.exports = router;
