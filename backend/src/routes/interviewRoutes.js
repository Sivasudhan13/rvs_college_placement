const router  = require('express').Router();
const { protect, authorise } = require('../middleware/auth');
const {
  startInterview, submitAnswer, completeInterview,
  evaluateInterview, getHistory, getSession, getAdminStats,
  getAutoListenConfig, processTranscript, getAutoListenFunctions,
} = require('../controllers/interviewController');

router.use(protect);

// Auto-Listen routes (must come before /:id to avoid param collision)
router.get  ('/auto-listen/config',    getAutoListenConfig);
router.post ('/auto-listen/process',   processTranscript);
router.get  ('/auto-listen/functions', getAutoListenFunctions);

// Student routes
router.get  ('/history',          getHistory);
router.post ('/start',            startInterview);
router.post ('/:id/answer',       submitAnswer);
router.post ('/:id/complete',     completeInterview);
router.post ('/:id/evaluate',     evaluateInterview);
router.get  ('/:id',              getSession);

// Admin stats
router.get('/admin/stats', authorise('admin', 'faculty'), getAdminStats);

module.exports = router;
