const router = require('express').Router();
const {
  getTrainings, createTraining, updateTraining, deleteTraining,
  bulkMarkAttendance, getAttendance, updateAttendance, deleteAttendance,
  getStudentReport, getDepartmentReport, getTrainingReport,
  getAnalytics, getLowAttendance, loadStudents,
} = require('../controllers/attendanceController');
const { protect, authorise } = require('../middleware/auth');

const adminRoles = ['admin', 'faculty'];

// Trainings
router.get   ('/trainings',           protect, getTrainings);
router.post  ('/trainings',           protect, authorise(...adminRoles), createTraining);
router.put   ('/trainings/:id',       protect, authorise(...adminRoles), updateTraining);
router.delete('/trainings/:id',       protect, authorise('admin'), deleteTraining);

// Analytics & reports (order matters — specific before :id)
router.get('/analytics',              protect, getAnalytics);
router.get('/low-attendance',         protect, getLowAttendance);
router.get('/load-students',          protect, loadStudents);
router.get('/report/student/:studentId', protect, getStudentReport);
router.get('/report/department',      protect, getDepartmentReport);
router.get('/report/training/:trainingId', protect, getTrainingReport);

// Bulk mark
router.post('/bulk',                  protect, authorise(...adminRoles), bulkMarkAttendance);

// CRUD
router.get   ('/',     protect, getAttendance);
router.put   ('/:id',  protect, authorise(...adminRoles), updateAttendance);
router.delete('/:id',  protect, authorise('admin'), deleteAttendance);

module.exports = router;
