const UserProgress = require('../models/UserProgress');
const Problem      = require('../models/Problem');
const asyncHandler = require('../utils/asyncHandler');

/* GET /api/dsa/progress  — current user */
exports.getMyProgress = asyncHandler(async (req, res) => {
  // Use upsert to avoid race-condition duplicate key errors
  let progress = await UserProgress.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } },
    { upsert: true, new: true }
  ).populate('solvedProblems.problem', 'title slug difficulty category order');

  const [easyTotal, mediumTotal, hardTotal] = await Promise.all([
    Problem.countDocuments({ difficulty: 'Easy',   isPublished: true }),
    Problem.countDocuments({ difficulty: 'Medium', isPublished: true }),
    Problem.countDocuments({ difficulty: 'Hard',   isPublished: true }),
  ]);

  const totalSolved = progress.easySolved + progress.mediumSolved + progress.hardSolved;
  const totalProblems = easyTotal + mediumTotal + hardTotal;
  const acceptanceRate = progress.totalSubmissions
    ? Math.round((progress.acceptedSubmissions / progress.totalSubmissions) * 100) : 0;

  res.status(200).json({
    success: true,
    progress: {
      ...progress.toObject(),
      totalSolved,
      totalProblems,
      easyTotal,
      mediumTotal,
      hardTotal,
      acceptanceRate,
    },
  });
});

/* GET /api/dsa/progress/:userId  — public profile */
exports.getUserProgress = asyncHandler(async (req, res) => {
  const progress = await UserProgress.findOne({ user: req.params.userId })
    .populate('solvedProblems.problem', 'title slug difficulty');

  if (!progress) {
    return res.status(200).json({ success: true, progress: null });
  }

  const totalSolved = progress.easySolved + progress.mediumSolved + progress.hardSolved;
  const acceptanceRate = progress.totalSubmissions
    ? Math.round((progress.acceptedSubmissions / progress.totalSubmissions) * 100) : 0;

  res.status(200).json({
    success: true,
    progress: { ...progress.toObject(), totalSolved, acceptanceRate },
  });
});
