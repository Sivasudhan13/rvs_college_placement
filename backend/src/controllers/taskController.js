const Task         = require('../models/Task');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/* ── GET /api/tasks ── */
exports.getTasks = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: tasks.length, tasks });
});

/* ── POST /api/tasks ── */
exports.createTask = asyncHandler(async (req, res) => {
  req.body.user = req.user.id;
  const task = await Task.create(req.body);
  res.status(201).json({ success: true, task });
});

/* ── PUT /api/tasks/:id ── */
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorised', 403));

  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, task });
});

/* ── DELETE /api/tasks/:id ── */
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorised', 403));

  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted' });
});

/* ── PATCH /api/tasks/:id/status ── */
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status },
    { new: true, runValidators: true }
  );
  if (!task) return next(new ApiError('Task not found', 404));
  res.status(200).json({ success: true, task });
});
