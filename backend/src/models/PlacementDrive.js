const mongoose = require('mongoose');

const PlacementDriveSchema = new mongoose.Schema({
  company:             { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driveDate:           { type: Date },
  registrationDeadline:{ type: Date },
  campusType:          { type: String, enum: ['ON Campus','OFF Campus','POOLED Campus'], default: 'ON Campus' },
  departments:         { type: [String], default: [] }, // ['cse','ece',...]
  batches:             { type: [String], default: [] },
  jobRole:             { type: String, default: '' },
  packageLPA:          { type: Number, default: 0 },
  venue:               { type: String, default: '' },
  description:         { type: String, default: '' },
  status:              { type: String, enum: ['Upcoming','Registration Open','Registration Closed','Completed','Cancelled'], default: 'Upcoming' },

  // Eligibility
  minCGPA:             { type: Number, default: 0 },
  maxBacklogs:         { type: Number, default: 0 },
  requiredSkills:      { type: [String], default: [] },
  eligibilityCriteria: { type: String, default: '' },

  // Stats (denormalised)
  eligibleCount:  { type: Number, default: 0 },
  invitedCount:   { type: Number, default: 0 },
  selectedCount:  { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

PlacementDriveSchema.index({ company: 1, driveDate: -1 });
PlacementDriveSchema.index({ status: 1 });
PlacementDriveSchema.index({ departments: 1 });

module.exports = mongoose.model('PlacementDrive', PlacementDriveSchema);
