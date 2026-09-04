const router = require('express').Router();
const {
  getTasks, createTask, updateTask, deleteTask, updateTaskStatus,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get   ('/',            protect, getTasks);
router.post  ('/',            protect, createTask);
router.put   ('/:id',         protect, updateTask);
router.delete('/:id',         protect, deleteTask);
router.patch ('/:id/status',  protect, updateTaskStatus);

module.exports = router;
