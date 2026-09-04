const mongoose = require('mongoose');

const DriveInvitationSchema = new mongoose.Schema({
  drive:      { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:     {
    type: String,
    enum: ['Invited','Accepted','Declined','Attended','Selected','Rejected','Pending'],
    default: 'Invited',
  },
  invitedAt:   { type: Date, default: Date.now },
  respondedAt: { type: Date },
  interviewRound: { type: String, default: '' },
  remarks:     { type: String, default: '' },
  invitedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

DriveInvitationSchema.index({ drive: 1, student: 1 }, { unique: true });
DriveInvitationSchema.index({ student: 1 });
DriveInvitationSchema.index({ drive: 1, status: 1 });

module.exports = mongoose.model('DriveInvitation', DriveInvitationSchema);
