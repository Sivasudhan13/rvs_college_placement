const User       = require('../models/User');
const Quiz       = require('../models/Quiz');
const Task       = require('../models/Task');
const Submission = require('../models/Submission');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');

/* ════════════════════════════════════════
   DASHBOARD STATS
════════════════════════════════════════ */
exports.getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalFaculty,
    totalQuizzes,
    totalSubmissions,
    recentSubmissions,
    topPerformers,
    submissionsByCategory,
    quizzesByCategory,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    Quiz.countDocuments({ isPublished: true }),
    Submission.countDocuments({}),

    // Last 5 submissions with user + quiz info
    Submission.find({})
      .populate('user', 'name studentId department')
      .populate('quiz', 'title category')
      .sort({ createdAt: -1 })
      .limit(5),

    // Top 5 students by average score
    Submission.aggregate([
      { $group: { _id: '$user', avgScore: { $avg: '$percentage' }, count: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.studentId': 1, 'user.department': 1, avgScore: 1, count: 1 } },
    ]),

    // Submissions grouped by quiz category
    Submission.aggregate([
      { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $group: { _id: '$quiz.category', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { count: -1 } },
    ]),

    // Quizzes by category
    Quiz.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      totalFaculty,
      totalQuizzes,
      totalSubmissions,
      recentSubmissions,
      topPerformers,
      submissionsByCategory,
      quizzesByCategory,
    },
  });
});

/* ════════════════════════════════════════
   STUDENTS — list / get / update / delete
════════════════════════════════════════ */
exports.getStudents = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  const filter = { role: 'student' };
  if (req.query.department) filter.department = req.query.department;
  if (req.query.batch)      filter.batch      = req.query.batch;
  if (req.query.search) {
    filter.$or = [
      { name:      { $regex: req.query.search, $options: 'i' } },
      { studentId: { $regex: req.query.search, $options: 'i' } },
      { email:     { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [students, total] = await Promise.all([
    User.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: students.length,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    students,
  });
});

/* ── POST /api/admin/students — create a new user ── */
exports.createStudent = asyncHandler(async (req, res, next) => {
  const { name, email, studentId, admissionNumber, department, batch, role, password } = req.body;

  if (!name || !email || !studentId || !password) {
    return next(new ApiError('name, email, studentId and password are required', 400));
  }

  const existing = await User.findOne({ $or: [{ email }, { studentId }] });
  if (existing) return next(new ApiError('Email or Student ID already exists', 400));

  const user = await User.create({
    name, email, studentId,
    admissionNumber: admissionNumber || studentId,
    department: department || 'cse',
    batch: batch || '',
    role: role || 'student',
    password: password,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    student: { ...user.toObject(), password: undefined },
  });
});

exports.getStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id).select('-password');
  if (!student) return next(new ApiError('Student not found', 404));

  // Their submissions
  const submissions = await Submission.find({ user: student._id })
    .populate('quiz', 'title category difficulty')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, student, submissions });
});

exports.updateStudent = asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'email', 'department', 'role', 'isActive'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const student = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  }).select('-password');
  if (!student) return next(new ApiError('Student not found', 404));

  res.status(200).json({ success: true, student });
});

exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student) return next(new ApiError('User not found', 404));
  if (student.role === 'admin') return next(new ApiError('Cannot delete admin', 403));

  await student.deleteOne();
  await Submission.deleteMany({ user: req.params.id });
  await Task.deleteMany({ user: req.params.id });

  res.status(200).json({ success: true, message: 'User deleted' });
});

/* ════════════════════════════════════════
   QUIZ MANAGEMENT
════════════════════════════════════════ */
exports.getAllQuizzesAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category)   filter.category   = req.query.category;
  if (req.query.difficulty) filter.difficulty  = req.query.difficulty;
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  const quizzes = await Quiz.find(filter)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: quizzes.length, quizzes });
});

exports.getQuizWithAnswers = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
  if (!quiz) return next(new ApiError('Quiz not found', 404));
  res.status(200).json({ success: true, quiz });
});

exports.addQuestion = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  quiz.questions.push(req.body);
  quiz.totalQuestions = quiz.questions.length;
  await quiz.save();

  res.status(201).json({ success: true, quiz });
});

exports.updateQuestion = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const question = quiz.questions.id(req.params.questionId);
  if (!question) return next(new ApiError('Question not found', 404));

  Object.assign(question, req.body);
  quiz.totalQuestions = quiz.questions.length;
  await quiz.save();

  res.status(200).json({ success: true, quiz });
});

exports.deleteQuestion = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  quiz.questions = quiz.questions.filter(
    (q) => q._id.toString() !== req.params.questionId
  );
  quiz.totalQuestions = quiz.questions.length;
  await quiz.save();

  res.status(200).json({ success: true, message: 'Question deleted', quiz });
});

exports.bulkImportQuestions = asyncHandler(async (req, res, next) => {
  // Expects { quizId, questions: [...] }
  const quiz = await Quiz.findById(req.body.quizId);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const incoming = Array.isArray(req.body.questions) ? req.body.questions : [];
  quiz.questions.push(...incoming);
  quiz.totalQuestions = quiz.questions.length;
  await quiz.save();

  res.status(201).json({ success: true, imported: incoming.length, quiz });
});

/* ════════════════════════════════════════
   REPORTS
════════════════════════════════════════ */
exports.getReports = asyncHandler(async (req, res) => {
  const [
    submissionTrend,
    departmentStats,
    quizPassRate,
    studentActivity,
  ] = await Promise.all([

    // Submissions per day (last 14 days)
    Submission.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$percentage' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Average score per department
    Submission.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: { _id: '$user.department', avgScore: { $avg: '$percentage' }, count: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
    ]),

    // Pass rate per quiz (pass = percentage >= 60)
    Submission.aggregate([
      {
        $group: {
          _id: '$quiz',
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $gte: ['$percentage', 60] }, 1, 0] } },
          avgScore: { $avg: '$percentage' },
        },
      },
      { $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      {
        $project: {
          title: '$quiz.title',
          category: '$quiz.category',
          total: 1,
          passed: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRate: { $round: [{ $multiply: [{ $divide: ['$passed', '$total'] }, 100] }, 1] },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Students with 0 submissions (inactive)
    User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'user',
          as: 'submissions',
        },
      },
      {
        $project: {
          name: 1, studentId: 1, department: 1,
          submissionCount: { $size: '$submissions' },
          lastActive: '$lastLogin',
        },
      },
      { $sort: { submissionCount: 1 } },
      { $limit: 10 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    reports: { submissionTrend, departmentStats, quizPassRate, studentActivity },
  });
});

exports.getSubmissionsReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.quizId) filter.quiz = req.query.quizId;

  const submissions = await Submission.find(filter)
    .populate('user', 'name studentId department email')
    .populate('quiz', 'title category difficulty totalQuestions')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: submissions.length, submissions });
});
