const Attendance  = require('../models/Attendance');
const Training    = require('../models/Training');
const User        = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');

/* ── helpers ── */
const dayStart = (d) => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; };
const dayEnd   = (d) => { const dt = new Date(d); dt.setHours(23,59,59,999); return dt; };

/* ══════════════════════════════════════
   TRAININGS (needed for mark attendance)
══════════════════════════════════════ */
exports.getTrainings = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.department) filter.departments = req.query.department;
  const trainings = await Training.find(filter).sort({ startDate: -1 });
  res.json({ success: true, trainings });
});

exports.createTraining = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const training = await Training.create(req.body);
  res.status(201).json({ success: true, training });
});

exports.updateTraining = asyncHandler(async (req, res, next) => {
  const training = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!training) return next(new ApiError('Training not found', 404));
  res.json({ success: true, training });
});

exports.deleteTraining = asyncHandler(async (req, res, next) => {
  const training = await Training.findById(req.params.id);
  if (!training) return next(new ApiError('Training not found', 404));
  training.isActive = false;
  await training.save();
  res.json({ success: true, message: 'Training archived' });
});

/* ══════════════════════════════════════
   BULK MARK ATTENDANCE
══════════════════════════════════════ */
exports.bulkMarkAttendance = asyncHandler(async (req, res, next) => {
  const { date, trainingId, department, year, batch, section, students } = req.body;
  // students: [{studentId, status}]

  if (!date || !trainingId || !students?.length) {
    return next(new ApiError('date, trainingId and students are required', 400));
  }

  const training = await Training.findById(trainingId);
  if (!training) return next(new ApiError('Training not found', 404));

  const attendanceDate = dayStart(date);
  const ops = [];
  const errors = [];

  for (const s of students) {
    try {
      await Attendance.findOneAndUpdate(
        { student: s.studentId, training: trainingId, date: attendanceDate },
        {
          student: s.studentId, training: trainingId, date: attendanceDate,
          status: s.status || 'Present',
          department: department || '',
          year: year || null,
          batch: batch || '',
          section: section || '',
          markedBy: req.user.id,
          updatedBy: req.user.id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      ops.push(s.studentId);
    } catch (err) {
      errors.push({ studentId: s.studentId, error: err.message });
    }
  }

  res.status(201).json({
    success: true,
    message: `Attendance marked for ${ops.length} students`,
    marked: ops.length,
    errors,
  });
});

/* ══════════════════════════════════════
   GET ATTENDANCE (with filters)
══════════════════════════════════════ */
exports.getAttendance = asyncHandler(async (req, res) => {
  const { training, department, year, batch, section, status,
          dateFrom, dateTo, student, page = 1, limit = 50 } = req.query;
  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};

  if (training)   filter.training   = training;
  if (department) filter.department = department;
  if (year)       filter.year       = parseInt(year);
  if (batch)      filter.batch      = batch;
  if (section)    filter.section    = section;
  if (status)     filter.status     = status;
  if (student)    filter.student    = student;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dayStart(dateFrom);
    if (dateTo)   filter.date.$lte = dayEnd(dateTo);
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('student',  'name studentId department batch')
      .populate('training', 'title type')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Attendance.countDocuments(filter),
  ]);

  res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), records });
});

/* ══════════════════════════════════════
   UPDATE SINGLE ATTENDANCE
══════════════════════════════════════ */
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) return next(new ApiError('Record not found', 404));

  record.status    = req.body.status || record.status;
  record.remarks   = req.body.remarks || record.remarks;
  record.updatedBy = req.user.id;
  await record.save();

  res.json({ success: true, record });
});

/* ══════════════════════════════════════
   DELETE ATTENDANCE
══════════════════════════════════════ */
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) return next(new ApiError('Record not found', 404));
  res.json({ success: true, message: 'Record deleted' });
});

/* ══════════════════════════════════════
   STUDENT ATTENDANCE REPORT
══════════════════════════════════════ */
exports.getStudentReport = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { dateFrom, dateTo, training } = req.query;

  const student = await User.findById(studentId).select('-password');
  if (!student) return next(new ApiError('Student not found', 404));

  const filter = { student: studentId };
  if (training) filter.training = training;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dayStart(dateFrom);
    if (dateTo)   filter.date.$lte = dayEnd(dateTo);
  }

  const records = await Attendance.find(filter)
    .populate('training', 'title type')
    .sort({ date: -1 });

  const total   = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent  = total - present;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  res.json({
    success: true,
    student,
    stats: { total, present, absent, percentage: pct, eligible: pct >= 75 },
    records,
  });
});

/* ══════════════════════════════════════
   DEPARTMENT REPORT
══════════════════════════════════════ */
exports.getDepartmentReport = asyncHandler(async (req, res) => {
  const { department, year, batch, dateFrom, dateTo, training } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (year)       filter.year       = parseInt(year);
  if (batch)      filter.batch      = batch;
  if (training)   filter.training   = training;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dayStart(dateFrom);
    if (dateTo)   filter.date.$lte = dayEnd(dateTo);
  }

  const records = await Attendance.find(filter)
    .populate('student', 'name studentId department batch year');

  // Group by student
  const byStudent = {};
  for (const r of records) {
    if (!r.student) continue;
    const key = r.student._id.toString();
    if (!byStudent[key]) byStudent[key] = { student: r.student, total: 0, present: 0 };
    byStudent[key].total++;
    if (r.status === 'Present') byStudent[key].present++;
  }

  const studentStats = Object.values(byStudent).map(s => ({
    ...s,
    absent: s.total - s.present,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  const deptTotal   = studentStats.reduce((a, s) => a + s.total, 0);
  const deptPresent = studentStats.reduce((a, s) => a + s.present, 0);

  res.json({
    success: true,
    department: department || 'All',
    stats: {
      totalStudents: studentStats.length,
      totalSessions: deptTotal,
      totalPresent:  deptPresent,
      totalAbsent:   deptTotal - deptPresent,
      avgPercentage: deptTotal > 0 ? Math.round((deptPresent / deptTotal) * 100) : 0,
    },
    students: studentStats,
  });
});

/* ══════════════════════════════════════
   TRAINING REPORT
══════════════════════════════════════ */
exports.getTrainingReport = asyncHandler(async (req, res, next) => {
  const { trainingId } = req.params;

  const training = await Training.findById(trainingId);
  if (!training) return next(new ApiError('Training not found', 404));

  const records = await Attendance.find({ training: trainingId })
    .populate('student', 'name studentId department batch year');

  const byStudent = {};
  for (const r of records) {
    if (!r.student) continue;
    const key = r.student._id.toString();
    if (!byStudent[key]) byStudent[key] = { student: r.student, present: 0, absent: 0 };
    if (r.status === 'Present') byStudent[key].present++;
    else byStudent[key].absent++;
  }

  const studentStats = Object.values(byStudent).map(s => ({
    ...s,
    total: s.present + s.absent,
    percentage: (s.present + s.absent) > 0 ? Math.round((s.present / (s.present + s.absent)) * 100) : 0,
  }));

  const totalPresent = records.filter(r => r.status === 'Present').length;

  res.json({
    success: true,
    training,
    stats: {
      totalStudents: studentStats.length,
      totalSessions: records.length,
      totalPresent,
      totalAbsent: records.length - totalPresent,
      avgPercentage: records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0,
    },
    students: studentStats,
  });
});

/* ══════════════════════════════════════
   DASHBOARD ANALYTICS
══════════════════════════════════════ */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const today = dayStart(new Date());
  const todayEnd = dayEnd(new Date());

  const [
    presentToday,
    absentToday,
    totalTrainings,
    totalStudents,
    // Low attendance aggregate
    lowAttendance,
    // Daily trend (last 14 days)
    dailyTrend,
    // Dept-wise
    deptStats,
  ] = await Promise.all([
    Attendance.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Present' }),
    Attendance.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Absent' }),
    Training.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),

    // Students below 75% (aggregate)
    Attendance.aggregate([
      { $group: { _id: '$student', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } } } },
      { $addFields: { pct: { $cond: [{ $gt: ['$total',0] }, { $multiply: [{ $divide: ['$present','$total'] }, 100] }, 0] } } },
      { $match: { pct: { $lt: 75 } } },
      { $count: 'count' },
    ]),

    // Daily 14-day trend
    Attendance.aggregate([
      { $match: { date: { $gte: new Date(Date.now() - 14*86400000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status','Absent']  }, 1, 0] } },
        total:   { $sum: 1 },
      }},
      { $sort: { '_id': 1 } },
    ]),

    // Dept-wise
    Attendance.aggregate([
      { $match: { department: { $ne: '' } } },
      { $group: {
        _id: '$department',
        present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } },
        total:   { $sum: 1 },
      }},
      { $addFields: { pct: { $cond: [{ $gt: ['$total',0] }, { $round: [{ $multiply: [{ $divide: ['$present','$total'] }, 100] }, 1] }, 0] } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  // Overall average
  const overallAgg = await Attendance.aggregate([
    { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } } } },
  ]);
  const overall = overallAgg[0] || { total: 0, present: 0 };
  const avgPct  = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0;

  res.json({
    success: true,
    summary: {
      totalStudents,
      presentToday,
      absentToday,
      avgAttendance: avgPct,
      totalTrainings,
      belowThreshold: lowAttendance[0]?.count || 0,
    },
    dailyTrend,
    deptStats,
  });
});

/* ══════════════════════════════════════
   LOW ATTENDANCE
══════════════════════════════════════ */
exports.getLowAttendance = asyncHandler(async (req, res) => {
  const threshold = parseFloat(req.query.threshold) || 75;
  const { department, batch } = req.query;

  const matchFilter = {};
  if (department) matchFilter.department = department;
  if (batch)      matchFilter.batch      = batch;

  const agg = await Attendance.aggregate([
    { $match: matchFilter },
    { $group: {
      _id: '$student',
      total:   { $sum: 1 },
      present: { $sum: { $cond: [{ $eq: ['$status','Present'] }, 1, 0] } },
      department: { $last: '$department' },
      batch:      { $last: '$batch' },
    }},
    { $addFields: { pct: { $cond: [{ $gt: ['$total',0] }, { $multiply: [{ $divide: ['$present','$total'] }, 100] }, 0] } } },
    { $match: { pct: { $lt: threshold } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'studentInfo' } },
    { $unwind: '$studentInfo' },
    { $project: { name: '$studentInfo.name', studentId: '$studentInfo.studentId', department: 1, batch: 1, total: 1, present: 1, pct: { $round: ['$pct', 1] } } },
    { $sort: { pct: 1 } },
  ]);

  res.json({ success: true, threshold, count: agg.length, students: agg });
});

/* ══════════════════════════════════════
   LOAD STUDENTS FOR MARK ATTENDANCE
══════════════════════════════════════ */
exports.loadStudents = asyncHandler(async (req, res) => {
  const { department, year, batch, section, trainingId, date } = req.query;

  const filter = { role: 'student', isActive: true };
  if (department) filter.department = department;
  if (batch)      filter.batch      = batch;
  if (year)       filter.year       = parseInt(year);

  const students = await User.find(filter).select('name studentId department batch').sort({ name: 1 });

  // Check existing attendance for this training+date
  let existingMap = {};
  if (trainingId && date) {
    const existing = await Attendance.find({
      training: trainingId,
      date: { $gte: dayStart(date), $lte: dayEnd(date) },
      student: { $in: students.map(s => s._id) },
    }).select('student status');
    existing.forEach(e => { existingMap[e.student.toString()] = e.status; });
  }

  const enriched = students.map(s => ({
    ...s.toObject(),
    currentStatus: existingMap[s._id.toString()] || null,
    alreadyMarked: !!existingMap[s._id.toString()],
  }));

  res.json({ success: true, count: enriched.length, students: enriched });
});
