const router = require('express').Router();
const {
  getProblems, getProblem, runCode, submitCode, getNextProblem,
} = require('../controllers/problemController');
const {
  getMySubmissions, getSubmission,
} = require('../controllers/submissionController');
const {
  getMyProgress, getUserProgress,
} = require('../controllers/progressController');
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect, authorise } = require('../middleware/auth');

// ── Problems ──
router.get('/problems',              protect, getProblems);
router.get('/problems/next/:slug',   protect, getNextProblem);
router.get('/problems/:slug',        protect, getProblem);
router.post('/problems/:id/run',     protect, runCode);
router.post('/problems/:id/submit',  protect, submitCode);

// ── Submissions ──
router.get('/submissions',     protect, getMySubmissions);
router.get('/submissions/:id', protect, getSubmission);

// ── Progress ──
router.get('/progress',          protect, getMyProgress);
router.get('/progress/:userId',  protect, getUserProgress);

// ── Leaderboard ──
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
