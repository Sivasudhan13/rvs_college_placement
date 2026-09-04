const Problem      = require('../models/Problem');
const DSASubmission = require('../models/DSASubmission');
const UserProgress  = require('../models/UserProgress');
const asyncHandler  = require('../utils/asyncHandler');
const ApiError      = require('../utils/ApiError');
const { runTestCases } = require('../services/codeExecutionService');

/* ── helpers ── */
const SCORES = { Easy: 10, Medium: 25, Hard: 50 };
const ACHIEVEMENTS = [
  { key: 'first_solve',    label: '🎯 First Solve',      check: (p) => p.totalSolved === 1 },
  { key: 'solve_10',       label: '🔥 10 Problems',      check: (p) => p.totalSolved === 10 },
  { key: 'solve_25',       label: '⭐ 25 Problems',      check: (p) => p.totalSolved === 25 },
  { key: 'solve_50',       label: '💎 50 Problems',      check: (p) => p.totalSolved === 50 },
  { key: 'solve_100',      label: '🏆 100 Problems',     check: (p) => p.totalSolved === 100 },
  { key: 'streak_10',      label: '🌊 10-Day Streak',    check: (p) => p.currentStreak === 10 },
  { key: 'streak_30',      label: '🌙 30-Day Streak',    check: (p) => p.currentStreak === 30 },
  { key: 'easy_master',    label: '🟢 Easy Master',      check: (p) => p.easySolved >= 20 },
  { key: 'medium_master',  label: '🟡 Medium Master',    check: (p) => p.mediumSolved >= 20 },
  { key: 'hard_master',    label: '🔴 Hard Master',      check: (p) => p.hardSolved >= 10 },
];

const updateStreak = (progress) => {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const last      = progress.lastSolvedDate ? new Date(progress.lastSolvedDate) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (!last || last < yesterday) {
    progress.currentStreak = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    progress.currentStreak += 1;
  }
  // same day: don't increment again
  progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
  progress.lastSolvedDate = today;
};

const checkAchievements = (progress) => {
  const totalSolved = progress.easySolved + progress.mediumSolved + progress.hardSolved;
  const extProg = { ...progress.toObject(), totalSolved, currentStreak: progress.currentStreak };
  ACHIEVEMENTS.forEach(({ key, check }) => {
    if (!progress.achievements.includes(key) && check(extProg)) {
      progress.achievements.push(key);
    }
  });
};

/* ════════════════════════════════════════
   GET /api/dsa/problems
════════════════════════════════════════ */
exports.getProblems = asyncHandler(async (req, res) => {
  const { difficulty, category, search, page = 1, limit = 50 } = req.query;
  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const filter = { isPublished: true };

  if (difficulty) filter.difficulty = difficulty;
  if (category)   filter.category   = category;
  if (search)     filter.title      = { $regex: search, $options: 'i' };

  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select('-testCases -hiddenTestCases -starterCode')
      .sort({ order: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Problem.countDocuments(filter),
  ]);

  // Attach solved status for logged-in users
  let solvedSet = new Set();
  let attemptedSet = new Set();
  if (req.user) {
    const progress = await UserProgress.findOne({ user: req.user.id });
    if (progress) {
      solvedSet    = new Set(progress.solvedProblems.map((s) => s.problem.toString()));
      attemptedSet = new Set(progress.attemptedProblems.map((id) => id.toString()));
    }
  }

  const enriched = problems.map((p) => ({
    ...p.toObject(),
    isSolved:   solvedSet.has(p._id.toString()),
    isAttempted: attemptedSet.has(p._id.toString()),
  }));

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    problems: enriched,
  });
});

/* ════════════════════════════════════════
   GET /api/dsa/problems/:slug
════════════════════════════════════════ */
exports.getProblem = asyncHandler(async (req, res, next) => {
  const problem = await Problem.findOne({ slug: req.params.slug, isPublished: true })
    .select('-hiddenTestCases'); // never expose hidden tests

  if (!problem) return next(new ApiError('Problem not found', 404));

  let isSolved = false;
  if (req.user) {
    const progress = await UserProgress.findOne({ user: req.user.id });
    if (progress) {
      isSolved = progress.solvedProblems.some((s) => s.problem.toString() === problem._id.toString());
      // Mark as attempted
      if (!progress.attemptedProblems.some((id) => id.toString() === problem._id.toString())) {
        progress.attemptedProblems.push(problem._id);
        await progress.save();
      }
    } else {
      await UserProgress.create({ user: req.user.id, attemptedProblems: [problem._id] });
    }
  }

  res.status(200).json({ success: true, problem: { ...problem.toObject(), isSolved } });
});

/* ════════════════════════════════════════
   POST /api/dsa/problems/:id/run
   Run against public test cases only
════════════════════════════════════════ */
exports.runCode = asyncHandler(async (req, res, next) => {
  const { language, sourceCode } = req.body;
  if (!language || !sourceCode) return next(new ApiError('language and sourceCode required', 400));
  if (sourceCode.length > 65536) return next(new ApiError('Source code too large', 400));

  const problem = await Problem.findById(req.params.id).select('testCases timeLimit title');
  if (!problem) return next(new ApiError('Problem not found', 404));

  const publicTests = problem.testCases.filter((tc) => !tc.isHidden);
  if (!publicTests.length) return next(new ApiError('No public test cases available', 400));

  const result = runTestCases({
    language,
    code: sourceCode,
    testCases: publicTests.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
    timeLimit: problem.timeLimit,
  });

  // Save as a "run" submission (not counted in stats)
  await DSASubmission.create({
    user: req.user.id, problem: req.params.id,
    language, sourceCode,
    status: result.status, passedTests: result.passed,
    totalTests: result.total, executionTime: result.executionTime,
    memoryUsed: result.memoryUsed, isRun: true,
  });

  res.status(200).json({
    success: true,
    status:        result.status,
    passed:        result.passed,
    total:         result.total,
    executionTime: result.executionTime,
    memoryUsed:    result.memoryUsed,
    results: result.results.map((r) => ({
      status:        r.status,
      output:        r.output,
      executionTime: r.executionTime,
      error:         r.error,
    })),
  });
});

/* ════════════════════════════════════════
   POST /api/dsa/problems/:id/submit
   Run against ALL hidden test cases
════════════════════════════════════════ */
exports.submitCode = asyncHandler(async (req, res, next) => {
  const { language, sourceCode } = req.body;
  if (!language || !sourceCode) return next(new ApiError('language and sourceCode required', 400));
  if (sourceCode.length > 65536) return next(new ApiError('Source code too large', 400));

  const problem = await Problem.findById(req.params.id);
  if (!problem) return next(new ApiError('Problem not found', 404));

  // All test cases (public + hidden)
  const allTests = [
    ...problem.testCases,
    ...problem.hiddenTestCases,
  ].map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }));

  const result = runTestCases({ language, code: sourceCode, testCases: allTests, timeLimit: problem.timeLimit });

  // Save submission
  const submission = await DSASubmission.create({
    user: req.user.id, problem: req.params.id,
    language, sourceCode,
    status: result.status, passedTests: result.passed,
    totalTests: result.total, executionTime: result.executionTime,
    memoryUsed: result.memoryUsed, isRun: false,
  });

  // Update problem stats
  problem.totalSubmissions  += 1;
  problem.totalAttempts     += 1;
  if (result.status === 'Accepted') problem.acceptedSubmissions += 1;
  await problem.save();

  // Update user progress
  let progress = await UserProgress.findOne({ user: req.user.id });
  if (!progress) progress = await UserProgress.create({ user: req.user.id });

  progress.totalSubmissions += 1;

  const alreadySolved = progress.solvedProblems.some(
    (s) => s.problem.toString() === problem._id.toString()
  );

  let newAchievements = [];
  let nextProblem     = null;

  if (result.status === 'Accepted') {
    progress.acceptedSubmissions += 1;

    if (!alreadySolved) {
      // Mark solved
      progress.solvedProblems.push({
        problem: problem._id,
        difficulty: problem.difficulty,
        language,
        executionTime: result.executionTime,
      });

      // Increment difficulty counters
      if (problem.difficulty === 'Easy')   progress.easySolved   += 1;
      if (problem.difficulty === 'Medium') progress.mediumSolved += 1;
      if (problem.difficulty === 'Hard')   progress.hardSolved   += 1;

      // Score
      progress.score += SCORES[problem.difficulty] || 0;

      // Streak
      updateStreak(progress);

      // Achievements
      const beforeAch = [...progress.achievements];
      checkAchievements(progress);
      newAchievements = progress.achievements.filter((a) => !beforeAch.includes(a));
    }

    // Find next problem
    const next = await Problem.findOne({ order: { $gt: problem.order }, isPublished: true })
      .select('title slug difficulty order')
      .sort({ order: 1 });
    if (next) nextProblem = { title: next.title, slug: next.slug, difficulty: next.difficulty, order: next.order };
  }

  // Ensure attempted
  if (!progress.attemptedProblems.some((id) => id.toString() === problem._id.toString())) {
    progress.attemptedProblems.push(problem._id);
  }

  await progress.save();

  res.status(200).json({
    success: true,
    status:          result.status,
    passedTests:     result.passed,
    totalTests:      result.total,
    executionTime:   result.executionTime,
    memoryUsed:      result.memoryUsed,
    alreadySolved,
    newAchievements,
    nextProblem,
    submissionId:    submission._id,
    score:           progress.score,
  });
});

/* ════════════════════════════════════════
   GET /api/dsa/problems/next/:slug
   Get next problem after current
════════════════════════════════════════ */
exports.getNextProblem = asyncHandler(async (req, res, next) => {
  const current = await Problem.findOne({ slug: req.params.slug }).select('order');
  if (!current) return next(new ApiError('Problem not found', 404));

  const nextP = await Problem.findOne({ order: { $gt: current.order }, isPublished: true })
    .select('title slug difficulty category order')
    .sort({ order: 1 });

  res.status(200).json({ success: true, nextProblem: nextP || null });
});
