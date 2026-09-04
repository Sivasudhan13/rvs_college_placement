const AptitudeQuestion  = require('../models/AptitudeQuestion');
const AptitudeTest      = require('../models/AptitudeTest');
const TestAttempt       = require('../models/TestAttempt');
const QuestionAttempt   = require('../models/QuestionAttempt');
const AptitudeProgress  = require('../models/AptitudeProgress');
const asyncHandler      = require('../utils/asyncHandler');
const ApiError          = require('../utils/ApiError');
const {
  calculateTestScore, pointsForQuestion, updateStreak,
  buildCategoryStats, TEST_COMPLETION_BONUS,
} = require('../services/scoringService');

/* ══════════════════════════════════════
   QUESTIONS
══════════════════════════════════════ */

/* GET /api/aptitude/questions */
exports.getQuestions = asyncHandler(async (req, res) => {
  const { category, subCategory, difficulty, search, page = 1, limit = 30 } = req.query;
  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const filter = { isPublished: true };

  if (category)    filter.category    = category;
  if (subCategory) filter.subCategory = subCategory;
  if (difficulty)  filter.difficulty  = difficulty;
  if (search)      filter.question    = { $regex: search, $options: 'i' };

  const [questions, total] = await Promise.all([
    AptitudeQuestion.find(filter)
      .select('-correctAnswer -explanation -hint') // hide answers in list
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    AptitudeQuestion.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), questions });
});

/* GET /api/aptitude/questions/:id */
exports.getQuestion = asyncHandler(async (req, res, next) => {
  const q = await AptitudeQuestion.findById(req.params.id).select('-correctAnswer -explanation');
  if (!q) return next(new ApiError('Question not found', 404));
  res.json({ success: true, question: q });
});

/* POST /api/aptitude/questions/:id/attempt  (practice mode) */
exports.attemptQuestion = asyncHandler(async (req, res, next) => {
  const { selectedAnswer, timeTaken = 0 } = req.body;
  const q = await AptitudeQuestion.findById(req.params.id);
  if (!q) return next(new ApiError('Question not found', 404));

  const isCorrect = selectedAnswer === q.correctAnswer;

  // Save attempt
  await QuestionAttempt.create({
    user: req.user.id, question: q._id,
    selectedAnswer, correctAnswer: q.correctAnswer,
    isCorrect, timeTaken, mode: 'practice',
  });

  // Update question stats
  q.totalAttempts++;
  if (isCorrect) q.correctAttempts++;
  await q.save();

  // Update progress
  let progress = await AptitudeProgress.findOneAndUpdate(
    { user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true, new: true }
  );

  progress.totalAttempted++;
  if (isCorrect) progress.totalCorrect++; else progress.totalWrong++;
  if (isCorrect) progress.totalPoints += pointsForQuestion(q.difficulty);

  // Category stats
  let catStat = progress.categoryStats.find((c) => c.category === q.category);
  if (!catStat) { progress.categoryStats.push({ category: q.category, attempted: 0, correct: 0, wrong: 0 }); catStat = progress.categoryStats[progress.categoryStats.length - 1]; }
  catStat.attempted++;
  if (isCorrect) catStat.correct++; else catStat.wrong++;

  updateStreak(progress);
  await progress.save();

  res.json({
    success: true,
    isCorrect,
    correctAnswer: q.correctAnswer,
    explanation:   q.explanation,
    hint:          q.hint,
    points:        isCorrect ? pointsForQuestion(q.difficulty) : 0,
  });
});

/* ══════════════════════════════════════
   TESTS
══════════════════════════════════════ */

/* GET /api/aptitude/tests */
exports.getTests = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;

  const tests = await AptitudeTest.find(filter).select('-questions').sort({ createdAt: -1 });
  res.json({ success: true, count: tests.length, tests });
});

/* GET /api/aptitude/tests/:id */
exports.getTest = asyncHandler(async (req, res, next) => {
  const test = await AptitudeTest.findById(req.params.id)
    .populate('questions', '-correctAnswer -explanation -hint'); // hide answers

  if (!test) return next(new ApiError('Test not found', 404));
  res.json({ success: true, test });
});

/* POST /api/aptitude/tests/:id/start */
exports.startTest = asyncHandler(async (req, res, next) => {
  const test = await AptitudeTest.findById(req.params.id).populate('questions');
  if (!test) return next(new ApiError('Test not found', 404));

  // Create a new TestAttempt
  const attempt = await TestAttempt.create({
    user:           req.user.id,
    test:           test._id,
    totalQuestions: test.questions.length,
    maxScore:       test.questions.length * test.marks,
    startedAt:      new Date(),
    status:         'In Progress',
    answers: test.questions.map((q) => ({
      questionId:     q._id,
      selectedAnswer: -1,
      isCorrect:      false,
      marksAwarded:   0,
    })),
  });

  res.json({
    success: true,
    attemptId: attempt._id,
    startedAt: attempt.startedAt,
    durationSeconds: test.duration * 60,
    test: {
      _id: test._id,
      name: test.name,
      duration: test.duration,
      totalQuestions: test.totalQuestions,
      marks: test.marks,
      negativeMarks: test.negativeMarks,
      questions: test.questions.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        category: q.category,
        subCategory: q.subCategory,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        timeLimit: q.timeLimit,
      })),
    },
  });
});

/* POST /api/aptitude/tests/:id/submit */
exports.submitTest = asyncHandler(async (req, res, next) => {
  const { attemptId, answers } = req.body; // answers: [{questionId, selectedAnswer, timeTaken}]

  const test = await AptitudeTest.findById(req.params.id).populate('questions');
  if (!test) return next(new ApiError('Test not found', 404));

  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) return next(new ApiError('Test attempt not found', 404));
  if (attempt.user.toString() !== req.user.id) return next(new ApiError('Not authorised', 403));
  if (attempt.status === 'Completed') return next(new ApiError('Test already submitted', 400));

  // Check time limit from server side
  const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
  const allowed  = test.duration * 60 + 30; // 30s grace
  const timedOut = elapsed > allowed;

  // Grade
  const { graded, score, maxScore, correct, wrong, skipped, percentage, accuracy } =
    calculateTestScore(test.questions, answers || [], test.marks, test.negativeMarks);

  const categoryStats = buildCategoryStats(test.questions, graded);
  const timeTaken = Math.min(elapsed, test.duration * 60);

  // Update attempt
  attempt.answers          = graded;
  attempt.correctAnswers   = correct;
  attempt.wrongAnswers     = wrong;
  attempt.skippedQuestions = skipped;
  attempt.score            = Math.max(0, score);   // never negative
  attempt.maxScore         = maxScore;
  attempt.percentage       = Math.max(0, percentage);
  attempt.accuracy         = accuracy;
  attempt.timeTaken        = timeTaken;
  attempt.status           = timedOut ? 'Timed Out' : 'Completed';
  attempt.completedAt      = new Date();
  attempt.categoryStats    = categoryStats;
  await attempt.save();

  // Bulk save question attempts
  const qaOps = graded.map((ans) => ({
    user: req.user.id, question: ans.questionId,
    selectedAnswer: ans.selectedAnswer,
    correctAnswer: test.questions.find((q) => q._id.toString() === ans.questionId.toString())?.correctAnswer ?? 0,
    isCorrect: ans.isCorrect, timeTaken: ans.timeTaken || 0,
    testAttempt: attempt._id, mode: 'test',
  }));
  await QuestionAttempt.insertMany(qaOps);

  // Update global progress
  let progress = await AptitudeProgress.findOneAndUpdate(
    { user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true, new: true }
  );

  progress.totalAttempted += test.questions.length;
  progress.totalCorrect   += correct;
  progress.totalWrong     += wrong;
  progress.testsCompleted += 1;
  progress.totalPoints    += TEST_COMPLETION_BONUS + (score * 2);
  progress.bestScore       = Math.max(progress.bestScore, percentage);

  // Running avg score
  const prevTests = progress.testsCompleted - 1;
  progress.avgScore = Math.round((progress.avgScore * prevTests + percentage) / progress.testsCompleted);

  // Merge category stats
  categoryStats.forEach((cs) => {
    let existing = progress.categoryStats.find((c) => c.category === cs.category);
    if (!existing) { progress.categoryStats.push({ category: cs.category, attempted: 0, correct: 0, wrong: 0 }); existing = progress.categoryStats[progress.categoryStats.length - 1]; }
    existing.attempted += cs.total;
    existing.correct   += cs.correct;
    existing.wrong     += cs.wrong;
  });

  updateStreak(progress);
  await progress.save();

  res.json({
    success: true,
    result: {
      attemptId:   attempt._id,
      score,
      maxScore,
      percentage:  Math.max(0, percentage),
      accuracy,
      correct,
      wrong,
      skipped,
      timeTaken,
      categoryStats,
      status:      attempt.status,
    },
  });
});

/* GET /api/aptitude/tests/results/:attemptId */
exports.getResult = asyncHandler(async (req, res, next) => {
  const attempt = await TestAttempt.findById(req.params.attemptId)
    .populate('test', 'name category duration marks negativeMarks')
    .populate(
      'answers.questionId',
      'question options correctAnswer explanation category subCategory difficulty marks negativeMarks'
    );

  if (!attempt) return next(new ApiError('Result not found', 404));
  if (attempt.user.toString() !== req.user.id) return next(new ApiError('Not authorised', 403));

  res.json({ success: true, attempt });
});

/* GET /api/aptitude/tests/history */
exports.getTestHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [attempts, total] = await Promise.all([
    TestAttempt.find({ user: req.user.id, status: { $ne: 'In Progress' } })
      .populate('test', 'name category duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TestAttempt.countDocuments({ user: req.user.id, status: { $ne: 'In Progress' } }),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), attempts });
});

/* ══════════════════════════════════════
   PROGRESS
══════════════════════════════════════ */

/* GET /api/aptitude/progress */
exports.getProgress = asyncHandler(async (req, res) => {
  let progress = await AptitudeProgress.findOneAndUpdate(
    { user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true, new: true }
  );

  const accuracy = (progress.totalCorrect + progress.totalWrong) > 0
    ? Math.round((progress.totalCorrect / (progress.totalCorrect + progress.totalWrong)) * 100) : 0;

  res.json({ success: true, progress: { ...progress.toObject(), accuracy } });
});

/* ══════════════════════════════════════
   DAILY CHALLENGE
══════════════════════════════════════ */

/* GET /api/aptitude/daily-challenge */
exports.getDailyChallenge = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // 5 random published questions
  const questions = await AptitudeQuestion.aggregate([
    { $match: { isPublished: true } },
    { $sample: { size: 5 } },
    { $project: { correctAnswer: 0, explanation: 0, hint: 0 } },
  ]);

  const progress  = await AptitudeProgress.findOne({ user: req.user.id });
  const completed = progress?.dailyChallengeCompleted?.includes(today) || false;

  res.json({ success: true, date: today, questions, completed, pointsReward: 25 });
});

/* POST /api/aptitude/daily-challenge/submit */
exports.submitDailyChallenge = asyncHandler(async (req, res) => {
  const { answers } = req.body; // [{questionId, selectedAnswer}]
  const today = new Date().toISOString().split('T')[0];

  let progress = await AptitudeProgress.findOneAndUpdate(
    { user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true, new: true }
  );

  const alreadyDone = progress.dailyChallengeCompleted?.includes(today);

  if (!alreadyDone) {
    progress.totalPoints += 25;
    progress.dailyChallengeCompleted.push(today);
    updateStreak(progress);
    await progress.save();
  }

  res.json({ success: true, alreadyDone, pointsAwarded: alreadyDone ? 0 : 25 });
});

/* ══════════════════════════════════════
   LEADERBOARD
══════════════════════════════════════ */

/* GET /api/aptitude/leaderboard */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const board = await AptitudeProgress.aggregate([
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $gt: [{ $add: ['$totalCorrect', '$totalWrong'] }, 0] },
            { $round: [{ $multiply: [{ $divide: ['$totalCorrect', { $add: ['$totalCorrect', '$totalWrong'] }] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { totalPoints: -1, totalCorrect: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
    { $unwind: '$userInfo' },
    {
      $project: {
        totalPoints: 1, totalAttempted: 1, totalCorrect: 1, testsCompleted: 1,
        accuracy: 1, currentStreak: 1,
        'userInfo.name': 1, 'userInfo.studentId': 1, 'userInfo.department': 1, 'userInfo._id': 1,
      },
    },
  ]);

  const total = await AptitudeProgress.countDocuments();

  res.json({
    success: true, total,
    page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)),
    leaderboard: board.map((e, i) => ({ rank: skip + i + 1, ...e })),
  });
});
