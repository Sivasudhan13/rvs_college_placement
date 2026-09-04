const Task         = require('../models/Task');
const Submission   = require('../models/Submission');
const Quiz         = require('../models/Quiz');
const asyncHandler = require('../utils/asyncHandler');

/* ── GET /api/dashboard ── */
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    taskStats,
    submissions,
    quizCount,
    recentTasks,
    recentSubmissions,
  ] = await Promise.all([
    // Task stats
    Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // All submissions for progress
    Submission.find({ user: userId }).populate('quiz', 'title category'),

    // Total available quizzes
    Quiz.countDocuments({ isPublished: true }),

    // 3 most urgent tasks (not completed)
    Task.find({ user: userId, status: { $ne: 'Completed' } })
      .sort({ dueDate: 1, priority: -1 })
      .limit(3),

    // Last 3 submissions
    Submission.find({ user: userId })
      .populate('quiz', 'title category')
      .sort({ createdAt: -1 })
      .limit(3),
  ]);

  // Normalise task stats
  const taskMap = { Todo: 0, 'In Progress': 0, Completed: 0 };
  taskStats.forEach((t) => { taskMap[t._id] = t.count; });
  const totalTasks = Object.values(taskMap).reduce((a, b) => a + b, 0);
  const completedTasks = taskMap['Completed'];

  // Assessment progress %
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((s, sub) => s + sub.percentage, 0) / submissions.length)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      assessmentProgress: avgScore,
      tasksCompleted:     completedTasks,
      tasksTotal:         totalTasks,
      quizzesAttempted:   submissions.length,
      quizzesAvailable:   quizCount,
      priorityTasks:      recentTasks,
      recentSubmissions,
    },
  });
});
