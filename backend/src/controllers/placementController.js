const Company        = require('../models/Company');
const PlacementDrive = require('../models/PlacementDrive');
const DriveInvitation= require('../models/DriveInvitation');
const Telecalling    = require('../models/Telecalling');
const User           = require('../models/User');
const asyncHandler   = require('../utils/asyncHandler');
const ApiError       = require('../utils/ApiError');

/* ══════════════════════════════════════
   COMPANIES
══════════════════════════════════════ */
exports.getCompanies = asyncHandler(async (req, res) => {
  const { search, type } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const companies = await Company.find(filter).sort({ name: 1 });
  res.json({ success: true, count: companies.length, companies });
});

exports.createCompany = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, company });
});

exports.getCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ApiError('Company not found', 404));
  const drives = await PlacementDrive.find({ company: company._id }).sort({ driveDate: -1 });
  res.json({ success: true, company, drives });
});

exports.updateCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) return next(new ApiError('Company not found', 404));
  res.json({ success: true, company });
});

exports.deleteCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ApiError('Company not found', 404));
  company.isActive = false;
  await company.save();
  res.json({ success: true, message: 'Company archived' });
});

/* ══════════════════════════════════════
   PLACEMENT DRIVES
══════════════════════════════════════ */
exports.getDrives = asyncHandler(async (req, res) => {
  const { status, department, campusType, search, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};

  if (status)     filter.status     = status;
  if (campusType) filter.campusType = campusType;
  if (department) filter.departments = department;
  if (dateFrom || dateTo) {
    filter.driveDate = {};
    if (dateFrom) filter.driveDate.$gte = new Date(dateFrom);
    if (dateTo)   filter.driveDate.$lte = new Date(dateTo);
  }

  let query = PlacementDrive.find(filter).populate('company', 'name type domain logo hrName hrEmail').sort({ driveDate: 1 });

  if (search) {
    const companies = await Company.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    filter.company = { $in: companies.map(c => c._id) };
    query = PlacementDrive.find(filter).populate('company', 'name type domain logo hrName hrEmail').sort({ driveDate: 1 });
  }

  const [drives, total] = await Promise.all([
    query.skip(skip).limit(parseInt(limit)),
    PlacementDrive.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), drives });
});

exports.createDrive = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const drive = await PlacementDrive.create(req.body);
  const populated = await PlacementDrive.findById(drive._id).populate('company', 'name type domain');
  res.status(201).json({ success: true, drive: populated });
});

exports.getDrive = asyncHandler(async (req, res, next) => {
  const drive = await PlacementDrive.findById(req.params.id)
    .populate('company', 'name type domain website hrName hrPhone hrEmail address location logo');
  if (!drive) return next(new ApiError('Drive not found', 404));

  // Invitation stats
  const invStats = await DriveInvitation.aggregate([
    { $match: { drive: drive._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const stats = {};
  invStats.forEach(s => { stats[s._id] = s.count; });

  res.json({ success: true, drive, invitationStats: stats });
});

exports.updateDrive = asyncHandler(async (req, res, next) => {
  const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('company', 'name type domain');
  if (!drive) return next(new ApiError('Drive not found', 404));
  res.json({ success: true, drive });
});

exports.deleteDrive = asyncHandler(async (req, res, next) => {
  const drive = await PlacementDrive.findByIdAndDelete(req.params.id);
  if (!drive) return next(new ApiError('Drive not found', 404));
  await DriveInvitation.deleteMany({ drive: req.params.id });
  res.json({ success: true, message: 'Drive deleted' });
});

/* ══════════════════════════════════════
   ELIGIBLE STUDENTS
══════════════════════════════════════ */
exports.findEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await PlacementDrive.findById(req.params.id);
  if (!drive) return next(new ApiError('Drive not found', 404));

  const filter = { role: 'student', isActive: true };
  if (drive.departments?.length) filter.department = { $in: drive.departments };
  if (drive.batches?.length)     filter.batch      = { $in: drive.batches };

  const students = await User.find(filter).select('name studentId department batch bio avatar');

  // Get invitation status for each student
  const invitations = await DriveInvitation.find({ drive: drive._id }).select('student status');
  const invMap = {};
  invitations.forEach(i => { invMap[i.student.toString()] = i.status; });

  const enriched = students.map(s => ({
    ...s.toObject(),
    invitationStatus: invMap[s._id.toString()] || 'Not Invited',
    eligible: true,
  }));

  // Update eligible count
  await PlacementDrive.findByIdAndUpdate(drive._id, { eligibleCount: enriched.length });

  res.json({ success: true, count: enriched.length, students: enriched, drive });
});

/* ══════════════════════════════════════
   INVITATIONS
══════════════════════════════════════ */
exports.sendInvitations = asyncHandler(async (req, res, next) => {
  const { studentIds } = req.body;
  const drive = await PlacementDrive.findById(req.params.id);
  if (!drive) return next(new ApiError('Drive not found', 404));
  if (!studentIds?.length) return next(new ApiError('No students selected', 400));

  let sent = 0, skipped = 0;
  for (const sid of studentIds) {
    try {
      await DriveInvitation.findOneAndUpdate(
        { drive: drive._id, student: sid },
        { drive: drive._id, student: sid, status: 'Invited', invitedBy: req.user.id, invitedAt: new Date() },
        { upsert: true, new: true }
      );
      sent++;
    } catch { skipped++; }
  }

  await PlacementDrive.findByIdAndUpdate(drive._id, { invitedCount: await DriveInvitation.countDocuments({ drive: drive._id }) });

  res.json({ success: true, message: `${sent} invitations sent`, sent, skipped });
});

exports.getInvitations = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { drive: req.params.id };
  if (status) filter.status = status;

  const invitations = await DriveInvitation.find(filter)
    .populate('student', 'name studentId department batch')
    .sort({ invitedAt: -1 });

  res.json({ success: true, count: invitations.length, invitations });
});

exports.updateInvitationStatus = asyncHandler(async (req, res, next) => {
  const inv = await DriveInvitation.findByIdAndUpdate(
    req.params.invId,
    { status: req.body.status, respondedAt: new Date(), remarks: req.body.remarks },
    { new: true }
  );
  if (!inv) return next(new ApiError('Invitation not found', 404));

  // Update selected count if applicable
  if (req.body.status === 'Selected') {
    const selCount = await DriveInvitation.countDocuments({ drive: inv.drive, status: 'Selected' });
    await PlacementDrive.findByIdAndUpdate(inv.drive, { selectedCount: selCount });
  }

  res.json({ success: true, invitation: inv });
});

// Student views own invitations
exports.getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await DriveInvitation.find({ student: req.user.id })
    .populate({
      path: 'drive',
      populate: { path: 'company', select: 'name type domain logo' },
    })
    .sort({ invitedAt: -1 });

  res.json({ success: true, invitations });
});

/* ══════════════════════════════════════
   PLACEMENT DASHBOARD
══════════════════════════════════════ */
exports.getPlacementDashboard = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const [
    upcomingCount, todayCount, openCount, completedCount,
    totalCompanies, totalInvited, totalSelected,
    upcomingDrives,
  ] = await Promise.all([
    PlacementDrive.countDocuments({ status: 'Upcoming' }),
    PlacementDrive.countDocuments({ driveDate: { $gte: today, $lte: todayEnd } }),
    PlacementDrive.countDocuments({ status: 'Registration Open' }),
    PlacementDrive.countDocuments({ status: 'Completed' }),
    Company.countDocuments({ isActive: true }),
    DriveInvitation.countDocuments({}),
    DriveInvitation.countDocuments({ status: 'Selected' }),
    PlacementDrive.find({ status: { $in: ['Upcoming','Registration Open'] }, driveDate: { $gte: today } })
      .populate('company', 'name type logo')
      .sort({ driveDate: 1 })
      .limit(6),
  ]);

  res.json({
    success: true,
    summary: { upcomingCount, todayCount, openCount, completedCount, totalCompanies, totalInvited, totalSelected },
    upcomingDrives,
  });
});

/* ══════════════════════════════════════
   TELECALLING
══════════════════════════════════════ */
exports.getTelecalling = asyncHandler(async (req, res) => {
  const { status, search, dueToday, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (status) filter.callStatus = status;
  if (search) filter.organizationName = { $regex: search, $options: 'i' };
  if (dueToday === 'true') {
    const today = new Date(); today.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    filter.nextFollowUpDate = { $gte: today, $lte: end };
  }

  const [records, total] = await Promise.all([
    Telecalling.find(filter).populate('company', 'name').sort({ callDate: -1 }).skip(skip).limit(parseInt(limit)),
    Telecalling.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), records });
});

exports.createTelecalling = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const record = await Telecalling.create(req.body);
  res.status(201).json({ success: true, record });
});

exports.updateTelecalling = asyncHandler(async (req, res, next) => {
  const record = await Telecalling.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!record) return next(new ApiError('Record not found', 404));
  res.json({ success: true, record });
});

exports.deleteTelecalling = asyncHandler(async (req, res, next) => {
  const record = await Telecalling.findByIdAndDelete(req.params.id);
  if (!record) return next(new ApiError('Record not found', 404));
  res.json({ success: true, message: 'Record deleted' });
});

exports.addFollowUp = asyncHandler(async (req, res, next) => {
  const record = await Telecalling.findById(req.params.id);
  if (!record) return next(new ApiError('Record not found', 404));

  record.followUps.push({ ...req.body, calledBy: req.user.id });
  if (req.body.status)          record.callStatus        = req.body.status;
  if (req.body.nextFollowUpDate) record.nextFollowUpDate = req.body.nextFollowUpDate;
  await record.save();

  res.json({ success: true, record });
});

exports.convertToDrive = asyncHandler(async (req, res, next) => {
  const tc = await Telecalling.findById(req.params.id);
  if (!tc) return next(new ApiError('Record not found', 404));

  // Create or find company
  let company = await Company.findOne({ name: tc.organizationName });
  if (!company) {
    company = await Company.create({
      name: tc.organizationName, hrName: tc.hrName,
      hrPhone: tc.contactNumber, hrEmail: tc.email,
      location: tc.location, address: tc.address,
      domain: tc.domain, createdBy: req.user.id,
    });
  }

  // Create drive with pre-filled data
  const drive = await PlacementDrive.create({
    company: company._id,
    driveDate: req.body.driveDate,
    campusType: req.body.campusType || 'ON Campus',
    departments: req.body.departments || [],
    jobRole: req.body.jobRole || '',
    packageLPA: req.body.packageLPA || 0,
    venue: req.body.venue || '',
    status: 'Upcoming',
    createdBy: req.user.id,
  });

  // Update telecalling record
  tc.driveCreated  = true;
  tc.drive         = drive._id;
  tc.callStatus    = 'Drive Confirmed';
  await tc.save();

  const populated = await PlacementDrive.findById(drive._id).populate('company', 'name type domain');
  res.status(201).json({ success: true, drive: populated, company });
});
