const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  trainer:     { type: String, default: '' },
  departments: { type: [String], default: [] }, // ['cse','ece',...]
  years:       { type: [Number], default: [] },  // [1,2,3,4]
  batches:     { type: [String], default: [] },  // ['A','B',...]
  sections:    { type: [String], default: [] },
  startDate:   { type: Date },
  endDate:     { type: Date },
  venue:       { type: String, default: '' },
  type:        { type: String, enum: ['Technical','Aptitude','Soft Skills','Placement Prep','Other'], default: 'Technical' },
  status:      { type: String, enum: ['Upcoming','Ongoing','Completed','Cancelled'], default: 'Upcoming' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

TrainingSchema.index({ departments: 1 });
TrainingSchema.index({ status: 1 });

module.exports = mongoose.model('Training', TrainingSchema);
