const router   = require('express').Router();
const { protect, authorise } = require('../middleware/auth');
const {
  getTests, getTest, createTest, updateTest, deleteTest,
  addQuestion, updateQuestion, deleteQuestion,
  startTest, submitTest, getResult, getHistory,
  getLeaderboard, getAdminStats,
} = require('../controllers/mockTestController');

const admin  = authorise('admin','faculty');
const auth   = protect;                          // any logged-in user

/* ── Admin stats ── */
router.get('/stats',          auth, admin, getAdminStats);

/* ── History (must be before /:id routes) ── */
router.get('/history',        auth, getHistory);

/* ── CRUD ── */
router.route('/')
  .get(auth,        getTests)
  .post(auth, admin, createTest);

router.route('/:id')
  .get(auth,         getTest)
  .put(auth,  admin, updateTest)
  .delete(auth, admin, deleteTest);

/* ── Questions ── */
router.post  ('/:id/questions',               auth, admin, addQuestion);
router.put   ('/:id/questions/:qId',          auth, admin, updateQuestion);
router.delete('/:id/questions/:qId',          auth, admin, deleteQuestion);

/* ── Student attempts ── */
router.post('/:id/start',    auth, startTest);
router.post('/:id/submit',   auth, submitTest);
router.get ('/:id/result',   auth, getResult);
router.get ('/:id/leaderboard', auth, getLeaderboard);

module.exports = router;
