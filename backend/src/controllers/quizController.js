const Quiz         = require('../models/Quiz');
const Submission   = require('../models/Submission');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/* ── GET /api/quizzes ── */
exports.getQuizzes = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.category)   filter.category   = req.query.category;
  if (req.query.difficulty) filter.difficulty  = req.query.difficulty;

  const quizzes = await Quiz.find(filter)
    .select('-questions')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: quizzes.length, quizzes });
});

/* ── GET /api/quizzes/:id ── */
exports.getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  // Strip correct answers before sending to client
  const quizObj = quiz.toObject();
  quizObj.questions = quizObj.questions.map(({ correctAnswer, explanation, ...q }) => q);

  res.status(200).json({ success: true, quiz: quizObj });
});

/* ── POST /api/quizzes  (faculty/admin only) ── */
exports.createQuiz = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const quiz = await Quiz.create(req.body);
  res.status(201).json({ success: true, quiz });
});

/* ── PUT /api/quizzes/:id  (faculty/admin only) ── */
exports.updateQuiz = asyncHandler(async (req, res, next) => {
  let quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, quiz });
});

/* ── DELETE /api/quizzes/:id  (admin only) ── */
exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  await quiz.deleteOne();
  res.status(200).json({ success: true, message: 'Quiz deleted' });
});

/* ── POST /api/quizzes/:id/submit ── */
exports.submitQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const { answers, timeTaken } = req.body; // answers: [{questionIndex, selectedOption}]

  let score = 0, correct = 0, wrong = 0, skipped = 0;
  const totalMarks = quiz.questions.reduce((s, q) => s + q.marks, 0);

  const gradedAnswers = quiz.questions.map((q, i) => {
    const given = answers.find((a) => a.questionIndex === i);
    if (!given || given.selectedOption === -1) {
      skipped++;
      return { questionIndex: i, selectedOption: -1, isCorrect: false, marksAwarded: 0 };
    }
    const isCorrect = given.selectedOption === q.correctAnswer;
    if (isCorrect) { score += q.marks; correct++; }
    else           { score -= q.negativeMarks; wrong++; }
    return { questionIndex: i, selectedOption: given.selectedOption, isCorrect, marksAwarded: isCorrect ? q.marks : -q.negativeMarks };
  });

  const submission = await Submission.findOneAndUpdate(
    { user: req.user.id, quiz: quiz._id },
    {
      user: req.user.id, quiz: quiz._id,
      answers: gradedAnswers, score,
      totalMarks, correctCount: correct, wrongCount: wrong, skippedCount: skipped,
      timeTaken: timeTaken || 0, status: 'Completed',
      percentage: Math.round((correct / quiz.questions.length) * 100),
    },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, submission });
});

/* ── GET /api/quizzes/:id/result ── */
exports.getQuizResult = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findOne({
    user: req.user.id,
    quiz: req.params.id,
  }).populate('quiz', 'title category duration totalQuestions');

  if (!submission) return next(new ApiError('No submission found for this quiz', 404));

  res.status(200).json({ success: true, submission });
});
