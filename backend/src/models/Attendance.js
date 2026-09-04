const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  training:   { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
  date:       { type: Date, required: true },
  status:     { type: String, enum: ['Present', 'Absent'], required: true },
  department: { type: String, default: '' },
  year:       { type: Number, default: null },
  batch:      { type: String, default: '' },
  section:    { type: String, default: '' },
  markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:    { type: String, default: '' },
}, { timestamps: true });

// Prevent duplicate: one record per student per training per date
AttendanceSchema.index({ student: 1, training: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ training: 1, date: 1 });
AttendanceSchema.index({ student: 1, date: 1 });
AttendanceSchema.index({ department: 1, date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
