const DSASubmission = require('../models/DSASubmission');
const asyncHandler  = require('../utils/asyncHandler');
const ApiError      = require('../utils/ApiError');

/* GET /api/dsa/submissions — my submissions */
exports.getMySubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, problemId } = req.query;
  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const filter = { user: req.user.id, isRun: false };
  if (problemId) filter.problem = problemId;

  const [submissions, total] = await Promise.all([
    DSASubmission.find(filter)
      .populate('problem', 'title slug difficulty category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    DSASubmission.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true, total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    submissions,
  });
});

/* GET /api/dsa/submissions/:id */
exports.getSubmission = asyncHandler(async (req, res, next) => {
  const sub = await DSASubmission.findById(req.params.id)
    .populate('problem', 'title slug difficulty category');

  if (!sub) return next(new ApiError('Submission not found', 404));

  // Only owner or admin can view
  if (sub.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError('Not authorised', 403));
  }

  res.status(200).json({ success: true, submission: sub });
});
