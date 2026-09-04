const router = require('express').Router();
const {
  getQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz,
  submitQuiz, getQuizResult,
} = require('../controllers/quizController');
const { protect, authorise } = require('../middleware/auth');

router.get ('/',              protect, getQuizzes);
router.get ('/:id',           protect, getQuiz);
router.post('/',              protect, authorise('faculty', 'admin'), createQuiz);
router.put ('/:id',           protect, authorise('faculty', 'admin'), updateQuiz);
router.delete('/:id',         protect, authorise('admin'), deleteQuiz);
router.post('/:id/submit',    protect, submitQuiz);
router.get ('/:id/result',    protect, getQuizResult);

module.exports = router;
