const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const User        = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const { getS3Client, getBucket } = require('../config/s3');

/* ── helper: extract S3 key from full URL ── */
const keyFromUrl = (url) => {
  if (!url) return null;
  try {
    return new URL(url).pathname.slice(1); // remove leading /
  } catch {
    return url; // already a key
  }
};

const deleteFromS3 = async (url) => {
  const key = keyFromUrl(url);
  if (!key) return;
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
    console.log('[S3] Deleted:', key);
  } catch (err) {
    console.error('[S3] Delete failed:', err.message);
  }
};

const normalizeCertificates = (user) => {
  const items = Array.isArray(user?.certificates) ? user.certificates.filter(Boolean) : [];
  if (user?.photoCertificate && !items.includes(user.photoCertificate)) {
    items.unshift(user.photoCertificate);
  }
  return [...new Set(items)];
};

/* ─────────────────────────────────────────
   GET /api/profile
───────────────────────────────────────── */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) throw new ApiError('User not found', 404);
  const payload = user.toObject();
  payload.certificates = normalizeCertificates(payload);
  if (!payload.photoCertificate) {
    payload.photoCertificate = payload.certificates[0] || '';
  }
  res.json({ success: true, user: payload });
});

/* ─────────────────────────────────────────
   PUT /api/profile
───────────────────────────────────────── */
exports.updateProfile = asyncHandler(async (req, res) => {
  const ALLOWED = [
    'name', 'phoneNumber', 'fatherName', 'motherName',
    'occupation', 'cgpa', 'bio', 'department', 'batch',
    'year', 'section', 'idCardNumber', 'interestedDomain',
  ];

  const updates = {};
  ALLOWED.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Keep admissionNumber in sync with idCardNumber for backward compat
  if (updates.idCardNumber !== undefined) {
    updates.admissionNumber = updates.idCardNumber;
  }

  if (updates.cgpa !== undefined) {
    const val = parseFloat(updates.cgpa);
    if (isNaN(val) || val < 0 || val > 10) {
      throw new ApiError('CGPA must be between 0 and 10', 400);
    }
    updates.cgpa = val;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true, runValidators: true,
  }).select('-password');

  const payload = user.toObject();
  payload.certificates = normalizeCertificates(payload);
  if (!payload.photoCertificate) {
    payload.photoCertificate = payload.certificates[0] || '';
  }
  res.json({ success: true, user: payload });
});

/* ─────────────────────────────────────────
   POST /api/profile/photo
   (multer middleware runs before this)
───────────────────────────────────────── */
exports.uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const imageUrl = req.file.location; // multer-s3 sets this

  // Delete old photo from S3 if exists
  const existing = await User.findById(req.user.id).select('avatar');
  if (existing?.avatar) await deleteFromS3(existing.avatar);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: imageUrl },
    { new: true }
  ).select('-password');

  res.json({ success: true, url: imageUrl, user });
});

/* ─────────────────────────────────────────
   POST /api/profile/certificate
───────────────────────────────────────── */
exports.uploadCertificate = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const imageUrl = req.file.location;
  const existing = await User.findById(req.user.id).select('photoCertificate certificates');
  const certificates = normalizeCertificates(existing);
  certificates.push(imageUrl);
  const nextCertificates = [...new Set(certificates)];
  const nextPrimary = existing?.photoCertificate || nextCertificates[0] || '';

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      photoCertificate: nextPrimary,
      certificates: nextCertificates,
    },
    { new: true }
  ).select('-password');

  const payload = user.toObject();
  payload.certificates = normalizeCertificates(payload);
  if (!payload.photoCertificate) {
    payload.photoCertificate = payload.certificates[0] || '';
  }
  res.json({ success: true, url: imageUrl, user: payload });
});

/* ─────────────────────────────────────────
   DELETE /api/profile/photo
───────────────────────────────────────── */
exports.deletePhoto = asyncHandler(async (req, res) => {
  const existing = await User.findById(req.user.id).select('avatar');
  if (existing?.avatar) await deleteFromS3(existing.avatar);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: '' },
    { new: true }
  ).select('-password');

  res.json({ success: true, user });
});

/* ─────────────────────────────────────────
   DELETE /api/profile/certificate
───────────────────────────────────────── */
exports.deleteCertificate = asyncHandler(async (req, res) => {
  const existing = await User.findById(req.user.id).select('photoCertificate certificates');
  const certificates = normalizeCertificates(existing);

  const requestedIndex = Number.parseInt(req.query.index, 10);
  let nextCertificates = [...certificates];
  let removedUrl = '';

  if (Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < nextCertificates.length) {
    removedUrl = nextCertificates.splice(requestedIndex, 1)[0];
  } else if (existing?.photoCertificate && nextCertificates.includes(existing.photoCertificate)) {
    removedUrl = existing.photoCertificate;
    nextCertificates = nextCertificates.filter((url) => url !== removedUrl);
  } else {
    removedUrl = nextCertificates.shift() || '';
  }

  if (!removedUrl) {
    throw new ApiError('Certificate not found', 404);
  }

  await deleteFromS3(removedUrl);

  const nextPrimary = nextCertificates.includes(existing?.photoCertificate)
    ? existing.photoCertificate
    : (nextCertificates[0] || '');

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      photoCertificate: nextPrimary,
      certificates: nextCertificates,
    },
    { new: true }
  ).select('-password');

  const payload = user.toObject();
  payload.certificates = normalizeCertificates(payload);
  if (!payload.photoCertificate) {
    payload.photoCertificate = payload.certificates[0] || '';
  }
  res.json({ success: true, user: payload });
});
