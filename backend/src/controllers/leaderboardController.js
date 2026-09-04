const UserProgress = require('../models/UserProgress');
const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/* GET /api/dsa/leaderboard */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const leaderboard = await UserProgress.aggregate([
    {
      $addFields: {
        totalSolved: { $add: ['$easySolved', '$mediumSolved', '$hardSolved'] },
        acceptanceRate: {
          $cond: [
            { $gt: ['$totalSubmissions', 0] },
            { $multiply: [{ $divide: ['$acceptedSubmissions', '$totalSubmissions'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { score: -1, totalSolved: -1, currentStreak: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        score: 1, totalSolved: 1, easySolved: 1, mediumSolved: 1, hardSolved: 1,
        currentStreak: 1, longestStreak: 1, totalSubmissions: 1,
        acceptanceRate: { $round: ['$acceptanceRate', 1] },
        'userInfo.name': 1, 'userInfo.studentId': 1, 'userInfo.department': 1, 'userInfo._id': 1,
      },
    },
  ]);

  const total = await UserProgress.countDocuments();

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    leaderboard: leaderboard.map((entry, i) => ({
      rank:          skip + i + 1,
      user:          entry.userInfo,
      score:         entry.score,
      totalSolved:   entry.totalSolved,
      easySolved:    entry.easySolved,
      mediumSolved:  entry.mediumSolved,
      hardSolved:    entry.hardSolved,
      currentStreak: entry.currentStreak,
      longestStreak: entry.longestStreak,
      acceptanceRate: entry.acceptanceRate,
      totalSubmissions: entry.totalSubmissions,
    })),
  });
});
