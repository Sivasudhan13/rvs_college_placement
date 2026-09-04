const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  id:     Number,
  title:  String,
  status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
  date:   String,
  skills: [String],
});

const PhaseSchema = new mongoose.Schema({
  phase:    String,
  title:    String,
  duration: String,
  status:   { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
  steps:    [StepSchema],
});

const RoadmapSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    activeTrack: { type: String, enum: ['sde', 'data', 'devops'], default: 'sde' },
    milestones:  { type: [PhaseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);
