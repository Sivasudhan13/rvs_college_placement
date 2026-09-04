const Notification = require('../models/Notification');
const User         = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const { sendGeneralNotification } = require('../services/emailService');

/* GET /api/notifications  (current user's notifications) */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip   = (parseInt(page)-1) * parseInt(limit);
  const filter = { recipient: req.user.id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user.id, isRead: false }),
  ]);

  res.json({ success: true, total, unreadCount, page: parseInt(page), totalPages: Math.ceil(total/parseInt(limit)), notifications });
});

/* GET /api/notifications/unread-count */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.json({ success: true, count });
});

/* PUT /api/notifications/:id/read */
exports.markRead = asyncHandler(async (req, res, next) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!n) return next(new ApiError('Notification not found', 404));
  res.json({ success: true, notification: n });
});

/* PUT /api/notifications/read-all */
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read' });
});

/* DELETE /api/notifications/:id */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
  if (!n) return next(new ApiError('Notification not found', 404));
  res.json({ success: true, message: 'Notification deleted' });
});

/* POST /api/notifications  (admin: broadcast to students) */
exports.createNotification = asyncHandler(async (req, res, next) => {
  const { title, message, type, targetAudience, department, year, batch, section, studentIds, actionUrl } = req.body;

  if (!title || !message) return next(new ApiError('Title and message are required', 400));

  // Build recipient list
  let recipients = [];

  if (targetAudience === 'all' || !targetAudience) {
    recipients = await User.find({ role: 'student', isActive: true }).select('_id email name');
  } else if (targetAudience === 'department' && department) {
    recipients = await User.find({ role: 'student', department, isActive: true }).select('_id email name');
  } else if (targetAudience === 'year' && year) {
    recipients = await User.find({ role: 'student', year: parseInt(year), isActive: true }).select('_id email name');
  } else if (targetAudience === 'batch' && batch) {
    recipients = await User.find({ role: 'student', batch, isActive: true }).select('_id email name');
  } else if (targetAudience === 'section' && section) {
    recipients = await User.find({ role: 'student', section, isActive: true }).select('_id email name');
  } else if (targetAudience === 'selected' && studentIds?.length) {
    recipients = await User.find({ _id: { $in: studentIds }, role: 'student' }).select('_id email name');
  }

  if (!recipients.length) return next(new ApiError('No matching recipients found', 400));

  const docs = recipients.map(r => ({
    recipient: r._id,
    sender:    req.user.id,
    title, message,
    type:      type || 'General',
    actionUrl: actionUrl || '',
  }));

  await Notification.insertMany(docs, { ordered: false });

  // Send emails (fire-and-forget)
  recipients.forEach(r => {
    sendGeneralNotification(r, { title, message, actionUrl }).catch(() => {});
  });

  res.status(201).json({ success: true, sent: docs.length, message: `Notification sent to ${docs.length} students` });
});
