const router = require('express').Router();
const {
  getCompanies, createCompany, getCompany, updateCompany, deleteCompany,
  getDrives, createDrive, getDrive, updateDrive, deleteDrive,
  findEligibleStudents, sendInvitations, getInvitations, updateInvitationStatus,
  getMyInvitations, getPlacementDashboard,
  getTelecalling, createTelecalling, updateTelecalling, deleteTelecalling,
  addFollowUp, convertToDrive,
} = require('../controllers/placementController');
const { protect, authorise } = require('../middleware/auth');

const adminRoles = ['admin', 'faculty'];

// Dashboard
router.get('/dashboard', protect, getPlacementDashboard);

// Companies
router.get   ('/companies',       protect, getCompanies);
router.post  ('/companies',       protect, authorise(...adminRoles), createCompany);
router.get   ('/companies/:id',   protect, getCompany);
router.put   ('/companies/:id',   protect, authorise(...adminRoles), updateCompany);
router.delete('/companies/:id',   protect, authorise('admin'), deleteCompany);

// Drives
router.get   ('/drives',          protect, getDrives);
router.post  ('/drives',          protect, authorise(...adminRoles), createDrive);
router.get   ('/drives/:id',      protect, getDrive);
router.put   ('/drives/:id',      protect, authorise(...adminRoles), updateDrive);
router.delete('/drives/:id',      protect, authorise('admin'), deleteDrive);

// Eligible students + invitations
router.get   ('/drives/:id/eligible',                        protect, authorise(...adminRoles), findEligibleStudents);
router.post  ('/drives/:id/invite',                          protect, authorise(...adminRoles), sendInvitations);
router.get   ('/drives/:id/invitations',                     protect, getInvitations);
router.put   ('/drives/:id/invitations/:invId',               protect, authorise(...adminRoles), updateInvitationStatus);

// Student: view own invitations
router.get('/my-invitations', protect, getMyInvitations);

// Telecalling
router.get   ('/telecalling',            protect, getTelecalling);
router.post  ('/telecalling',            protect, authorise(...adminRoles), createTelecalling);
router.put   ('/telecalling/:id',        protect, authorise(...adminRoles), updateTelecalling);
router.delete('/telecalling/:id',        protect, authorise('admin'), deleteTelecalling);
router.post  ('/telecalling/:id/followup', protect, authorise(...adminRoles), addFollowUp);
router.post  ('/telecalling/:id/convert',  protect, authorise(...adminRoles), convertToDrive);

module.exports = router;
