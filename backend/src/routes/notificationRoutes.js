const router = require('express').Router();
const { protect, authorise } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  createNotification,
} = require('../controllers/notificationController');

const auth  = protect;
const admin = authorise('admin','faculty');

router.get  ('/',             auth, getNotifications);
router.get  ('/unread-count', auth, getUnreadCount);
router.put  ('/read-all',     auth, markAllRead);
router.post ('/',             auth, admin, createNotification);
router.put  ('/:id/read',     auth, markRead);
router.delete('/:id',         auth, deleteNotification);

module.exports = router;
