const MockTest    = require('../models/MockTest');
const MockAttempt = require('../models/MockAttempt');
const Notification= require('../models/Notification');
const User        = require('../models/User');
const asyncHandler= require('../utils/asyncHandler');
const ApiError    = require('../utils/ApiError');
const { sendMockTestNotification } = require('../services/emailService');

/* ══════════════════════════════════════
   ADMIN — CRUD
══════════════════════════════════════ */

/* GET /api/mock-tests  (admin: all, student: published+available) */
exports.getTests = asyncHandler(async (req, res) => {
  const isAdmin = ['admin','faculty'].includes(req.user?.role);
  const { category, status, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page)-1) * parseInt(limit);

  const filter = {};
  if (!isAdmin) {
    filter.status = 'Published';
    const now = new Date();
    filter.$or = [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } },
    ];
  } else if (status) {
    filter.status = status;
  }
  if (category) filter.category = category;
  if (search)   filter.title    = { $regex: search, $options: 'i' };

  const [tests, total] = await Promise.all([
    MockTest.find(filter)
      .select('-questions.correctAnswer -questions.explanation') // hide answers for students
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MockTest.countDocuments(filter),
  ]);

  // If admin, show answers
  const testsWithAnswers = isAdmin
    ? await MockTest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
    : tests;

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total/parseInt(limit)), tests: testsWithAnswers });
});

/* GET /api/mock-tests/:id */
exports.getTest = asyncHandler(async (req, res, next) => {
  const isAdmin = ['admin','faculty'].includes(req.user?.role);
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));

  // Check availability for students
  if (!isAdmin) {
    if (test.status !== 'Published') return next(new ApiError('Test not available', 403));
    const now = new Date();
    if (test.endDate && now > test.endDate) return next(new ApiError('Test has ended', 403));
  }

  // Strip correct answers for students
  const testObj = test.toObject();
  if (!isAdmin) {
    testObj.questions = testObj.questions.map(({ correctAnswer, explanation, ...rest }) => rest);
  }

  // Check if student already attempted
  let attempt = null;
  if (req.user && !isAdmin) {
    attempt = await MockAttempt.findOne({ mockTest: test._id, student: req.user.id }).select('status finalScore percentage passed');
  }

  res.json({ success: true, test: testObj, attempt });
});

/* POST /api/mock-tests  (admin only) */
exports.createTest = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const test = await MockTest.create(req.body);
  res.status(201).json({ success: true, test });
});

/* PUT /api/mock-tests/:id  (admin only) */
exports.updateTest = asyncHandler(async (req, res, next) => {
  const prevTest = await MockTest.findById(req.params.id);
  if (!prevTest) return next(new ApiError('Test not found', 404));

  const wasPublished = prevTest.status === 'Published';
  const isNowPublished = req.body.status === 'Published';

  const test = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  // Auto-notify when published for the first time
  if (!wasPublished && isNowPublished) {
    await notifyStudentsOfNewTest(test, req.user.id);
  }

  res.json({ success: true, test });
});

/* DELETE /api/mock-tests/:id  (admin only) */
exports.deleteTest = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findByIdAndDelete(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  await MockAttempt.deleteMany({ mockTest: req.params.id });
  res.json({ success: true, message: 'Test deleted' });
});

/* ══════════════════════════════════════
   QUESTIONS (admin only)
══════════════════════════════════════ */

/* POST /api/mock-tests/:id/questions */
exports.addQuestion = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  test.questions.push(req.body);
  test.totalQuestions = test.questions.length;
  await test.save();
  res.status(201).json({ success: true, test });
});

/* PUT /api/mock-tests/:id/questions/:qId */
exports.updateQuestion = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  const q = test.questions.id(req.params.qId);
  if (!q) return next(new ApiError('Question not found', 404));
  Object.assign(q, req.body);
  await test.save();
  res.json({ success: true, test });
});

/* DELETE /api/mock-tests/:id/questions/:qId */
exports.deleteQuestion = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  test.questions = test.questions.filter(q => q._id.toString() !== req.params.qId);
  test.totalQuestions = test.questions.length;
  await test.save();
  res.json({ success: true, message: 'Question deleted', test });
});

/* ══════════════════════════════════════
   STUDENT — START / SUBMIT
══════════════════════════════════════ */

/* POST /api/mock-tests/:id/start */
exports.startTest = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  if (test.status !== 'Published') return next(new ApiError('Test is not available', 403));

  const now = new Date();
  if (test.endDate && now > test.endDate) return next(new ApiError('Test has ended', 403));
  if (test.startDate && now < test.startDate) return next(new ApiError('Test has not started yet', 403));

  // Check existing attempt
  const existing = await MockAttempt.findOne({ mockTest: test._id, student: req.user.id });
  if (existing && existing.status === 'Completed') {
    return next(new ApiError('You have already completed this test', 400));
  }
  if (existing && existing.status === 'In Progress') {
    // Resume — calculate remaining time from server
    const elapsed = Math.floor((now - existing.startedAt) / 1000);
    const remaining = Math.max(0, test.duration * 60 - elapsed);
    if (remaining === 0) {
      // auto-submit timed out attempt
      existing.status = 'Timed Out';
      await existing.save();
      return next(new ApiError('Test time has expired', 400));
    }
    return res.json({
      success: true,
      attemptId: existing._id,
      remainingSeconds: remaining,
      startedAt: existing.startedAt,
      questions: test.questions.map(({ correctAnswer, explanation, ...rest }) => rest),
      test: { _id: test._id, title: test.title, duration: test.duration, totalQuestions: test.totalQuestions },
    });
  }

  // New attempt
  const attempt = await MockAttempt.create({
    mockTest: test._id,
    student: req.user.id,
    startedAt: now,
    totalQuestions: test.questions.length,
    status: 'In Progress',
  });

  res.json({
    success: true,
    attemptId: attempt._id,
    remainingSeconds: test.duration * 60,
    startedAt: attempt.startedAt,
    questions: test.questions.map(({ correctAnswer, explanation, ...rest }) => rest),
    test: { _id: test._id, title: test.title, duration: test.duration, totalQuestions: test.totalQuestions },
  });
});

/* POST /api/mock-tests/:id/submit */
exports.submitTest = asyncHandler(async (req, res, next) => {
  const { attemptId, answers } = req.body;
  // answers: [{ questionIndex: 0, selectedOptions: [1] }]

  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));

  const attempt = await MockAttempt.findById(attemptId);
  if (!attempt) return next(new ApiError('Attempt not found', 404));
  if (attempt.student.toString() !== req.user.id) return next(new ApiError('Not authorised', 403));
  if (attempt.status === 'Completed') return next(new ApiError('Test already submitted', 400));

  // Server-side time check
  const now      = new Date();
  const elapsed  = Math.floor((now - attempt.startedAt) / 1000);
  const allowed  = test.duration * 60 + 30; // 30s grace
  const timedOut = elapsed > allowed;

  // Evaluate — server-side only
  let correct = 0, wrong = 0, unanswered = 0, scoredMarks = 0, negativeTotal = 0;
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0);
  const gradedAnswers = [];

  test.questions.forEach((q, idx) => {
    const given = answers?.find(a => a.questionIndex === idx);
    const sel   = given?.selectedOptions || [];

    if (!sel.length) {
      unanswered++;
      gradedAnswers.push({ questionIndex: idx, selectedOptions: [], isCorrect: false });
      return;
    }

    // Compare sorted arrays for correctness
    const isCorrect = JSON.stringify([...sel].sort()) === JSON.stringify([...q.correctAnswer].sort());
    if (isCorrect) {
      correct++;
      scoredMarks += q.marks;
    } else {
      wrong++;
      negativeTotal += q.negativeMarks;
      scoredMarks   -= q.negativeMarks;
    }
    gradedAnswers.push({ questionIndex: idx, selectedOptions: sel, isCorrect });
  });

  const finalScore = Math.max(0, scoredMarks);
  const percentage = totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100 * 10) / 10 : 0;
  const passed     = percentage >= test.passingPercentage;

  attempt.answers        = gradedAnswers;
  attempt.timeTaken      = Math.min(elapsed, test.duration * 60);
  attempt.status         = timedOut ? 'Timed Out' : 'Completed';
  attempt.submittedAt    = now;
  attempt.attempted      = correct + wrong;
  attempt.correct        = correct;
  attempt.wrong          = wrong;
  attempt.unanswered     = unanswered;
  attempt.totalMarks     = totalMarks;
  attempt.scoredMarks    = finalScore;
  attempt.negativeMarks  = negativeTotal;
  attempt.finalScore     = finalScore;
  attempt.percentage     = percentage;
  attempt.passed         = passed;
  await attempt.save();

  // Update test stats
  test.totalAttempts = await MockAttempt.countDocuments({ mockTest: test._id, status: { $in: ['Completed','Timed Out'] } });
  const allScores = await MockAttempt.find({ mockTest: test._id, status: { $in: ['Completed','Timed Out'] } }).select('percentage passed');
  test.averageScore = allScores.length ? Math.round(allScores.reduce((s,a) => s + a.percentage, 0) / allScores.length) : 0;
  test.passCount    = allScores.filter(a => a.passed).length;
  await test.save();

  res.json({
    success: true,
    result: {
      attemptId:    attempt._id,
      totalQuestions: attempt.totalQuestions,
      attempted:    attempt.attempted,
      correct:      attempt.correct,
      wrong:        attempt.wrong,
      unanswered:   attempt.unanswered,
      totalMarks:   attempt.totalMarks,
      finalScore:   attempt.finalScore,
      negativeMarks:attempt.negativeMarks,
      percentage:   attempt.percentage,
      passed:       attempt.passed,
      timeTaken:    attempt.timeTaken,
      status:       attempt.status,
    },
  });
});

/* GET /api/mock-tests/:id/result  (student's own result) */
exports.getResult = asyncHandler(async (req, res, next) => {
  const attempt = await MockAttempt.findOne({ mockTest: req.params.id, student: req.user.id, status: { $in: ['Completed','Timed Out'] } });
  if (!attempt) return next(new ApiError('No result found', 404));

  const test = await MockTest.findById(req.params.id);

  // Show answers/explanations only if admin configured it
  let questionsWithAnswers = null;
  if (test?.showAnswers) {
    questionsWithAnswers = test.questions.map((q, i) => ({
      ...q.toObject(),
      yourAnswer:    attempt.answers?.[i]?.selectedOptions || [],
      isCorrect:     attempt.answers?.[i]?.isCorrect || false,
    }));
  }

  // Leaderboard rank
  let rank = null;
  if (test?.showLeaderboard) {
    rank = (await MockAttempt.countDocuments({
      mockTest: test._id,
      status: { $in: ['Completed','Timed Out'] },
      finalScore: { $gt: attempt.finalScore },
    })) + 1;
  }

  res.json({ success: true, attempt, questions: questionsWithAnswers, rank, test: { title: test?.title, passingPercentage: test?.passingPercentage, showAnswers: test?.showAnswers } });
});

/* GET /api/mock-tests/history  (student's test history) */
exports.getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page)-1) * parseInt(limit);

  const [attempts, total] = await Promise.all([
    MockAttempt.find({ student: req.user.id, status: { $in: ['Completed','Timed Out'] } })
      .populate('mockTest', 'title category difficulty duration passingPercentage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MockAttempt.countDocuments({ student: req.user.id, status: { $in: ['Completed','Timed Out'] } }),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total/parseInt(limit)), attempts });
});

/* GET /api/mock-tests/:id/leaderboard */
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) return next(new ApiError('Test not found', 404));
  if (!test.showLeaderboard && !['admin','faculty'].includes(req.user?.role)) {
    return next(new ApiError('Leaderboard not available', 403));
  }

  const lb = await MockAttempt.aggregate([
    { $match: { mockTest: test._id, status: { $in: ['Completed','Timed Out'] } } },
    { $sort: { finalScore: -1, timeTaken: 1 } },
    { $limit: 50 },
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
    { $unwind: '$studentInfo' },
    { $project: { finalScore: 1, percentage: 1, passed: 1, timeTaken: 1, 'studentInfo.name': 1, 'studentInfo.studentId': 1, 'studentInfo.department': 1 } },
  ]);

  res.json({ success: true, leaderboard: lb.map((e,i) => ({ rank: i+1, ...e })) });
});

/* ── Admin dashboard stats ── */
exports.getAdminStats = asyncHandler(async (req, res) => {
  const [total, published, draft, totalAttempts, avgRes] = await Promise.all([
    MockTest.countDocuments(),
    MockTest.countDocuments({ status: 'Published' }),
    MockTest.countDocuments({ status: 'Draft' }),
    MockAttempt.countDocuments({ status: { $in: ['Completed','Timed Out'] } }),
    MockAttempt.aggregate([
      { $match: { status: { $in: ['Completed','Timed Out'] } } },
      { $group: { _id: null, avg: { $avg: '$percentage' }, passCount: { $sum: { $cond: ['$passed', 1, 0] } } } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      total, published, draft,
      totalAttempts,
      averageScore: avgRes[0]?.avg ? Math.round(avgRes[0].avg) : 0,
      passPercentage: totalAttempts > 0 ? Math.round((avgRes[0]?.passCount / totalAttempts) * 100) : 0,
    },
  });
});

/* ── Internal helper: notify students when test published ── */
async function notifyStudentsOfNewTest(test, senderId) {
  try {
    const filter = { role: 'student', isActive: true };
    if (test.targetDepartments?.length) filter.department = { $in: test.targetDepartments };
    const students = await User.find(filter).select('_id email name');

    const notifications = students.map(s => ({
      recipient: s._id,
      sender:    senderId,
      title:     `New Mock Test: ${test.title}`,
      message:   `A new ${test.category} mock test has been published. Questions: ${test.totalQuestions}, Duration: ${test.duration} min.`,
      type:      'MockTest',
      relatedId: test._id,
      relatedModel: 'MockTest',
      actionUrl: `/student/mock-tests/${test._id}`,
    }));

    await Notification.insertMany(notifications, { ordered: false });

    // Fire-and-forget emails
    students.forEach(s => {
      sendMockTestNotification(s, test).catch(() => {});
    });
  } catch (err) {
    console.error('[MockTest] Notify error:', err.message);
  }
}
exports._notifyStudentsOfNewTest = notifyStudentsOfNewTest;
