const router  = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getProfile, updateProfile,
  uploadPhoto, uploadCertificate,
  deletePhoto, deleteCertificate,
} = require('../controllers/profileController');
const { uploadProfilePhoto, uploadPhotoCertificate, handleUpload } = require('../middleware/upload');

router.use(protect);

router.get ('/',             getProfile);
router.put ('/',             updateProfile);

router.post  ('/photo',        handleUpload(uploadProfilePhoto),     uploadPhoto);
router.delete('/photo',        deletePhoto);

router.post  ('/certificate',  handleUpload(uploadPhotoCertificate), uploadCertificate);
router.delete('/certificate',  deleteCertificate);

module.exports = router;
