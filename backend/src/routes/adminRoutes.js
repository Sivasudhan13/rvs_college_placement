const router = require('express').Router();
const {
  getAdminStats,
  getStudents, getStudent, updateStudent, deleteStudent, createStudent,
  getAllQuizzesAdmin, getQuizWithAnswers,
  addQuestion, updateQuestion, deleteQuestion, bulkImportQuestions,
  getReports, getSubmissionsReport,
} = require('../controllers/adminController');
const {
  getQuizzes, createQuiz, updateQuiz, deleteQuiz,
} = require('../controllers/quizController');
const { protect, authorise } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, authorise('admin'));

/* ── Dashboard ── */
router.get('/stats', getAdminStats);

/* ── Students ── */
router.get   ('/students',       getStudents);
router.post  ('/students',       createStudent);
router.get   ('/students/:id',   getStudent);
router.put   ('/students/:id',   updateStudent);
router.delete('/students/:id',   deleteStudent);

/* ── Quiz management ── */
router.get ('/quizzes',           getAllQuizzesAdmin);
router.get ('/quizzes/:id',       getQuizWithAnswers);
router.post('/quizzes',           createQuiz);
router.put ('/quizzes/:id',       updateQuiz);
router.delete('/quizzes/:id',     deleteQuiz);

/* ── Question management ── */
router.post  ('/quizzes/:id/questions',                    addQuestion);
router.put   ('/quizzes/:id/questions/:questionId',        updateQuestion);
router.delete('/quizzes/:id/questions/:questionId',        deleteQuestion);
router.post  ('/quizzes/bulk-import',                      bulkImportQuestions);

/* ── Reports ── */
router.get('/reports',              getReports);
router.get('/reports/submissions',  getSubmissionsReport);

module.exports = router;
