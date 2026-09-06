const multer  = require('multer');
const multerS3 = require('multer-s3');
const path     = require('path');
const { getS3Client, getBucket } = require('../config/s3');

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
  cb(null, true);
};

/**
 * Build a multer instance that uploads directly to S3.
 * @param {string} folder  — S3 prefix, e.g. 'profiles' or 'certificates'
 */
const createUploader = (folder) =>
  multer({
    storage: multerS3({
      s3:          getS3Client(),
      bucket:      getBucket(),
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata:    (req, file, cb) => cb(null, { fieldName: file.fieldname }),
      key: (req, file, cb) => {
        const ext      = path.extname(file.originalname).toLowerCase();
        const userId   = req.user?._id || req.user?.id || 'unknown';
        const filename = `${folder}/${userId}-${Date.now()}${ext}`;
        cb(null, filename);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  });

// Single-file uploaders
const uploadProfilePhoto    = createUploader('profiles').single('photo');
const uploadPhotoCertificate = createUploader('certificates').single('certificate');

/**
 * Multer error wrapper — converts multer errors into JSON 400 responses.
 */
const handleUpload = (uploader) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (!err) return next();
    const status  = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `File too large — maximum ${MAX_SIZE_MB} MB allowed`
      : err.message || 'File upload failed';
    return res.status(status).json({ success: false, message });
  });
};

module.exports = { uploadProfilePhoto, uploadPhotoCertificate, handleUpload };
