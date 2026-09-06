const mongoose = require('mongoose');

const QASchema = new mongoose.Schema({
  questionNumber: { type: Number },
  question:       { type: String, required: true },
  answer:         { type: String, default: '' },
  timeTaken:      { type: Number, default: 0 },
  wordCount:      { type: Number, default: 0 },
}, { _id: false });

const ScoresSchema = new mongoose.Schema({
  overall:          { type: Number, default: 0 },
  communication:    { type: Number, default: 0 },
  fluency:          { type: Number, default: 0 },
  roleKnowledge:    { type: Number, default: 0 },
  answerRelevance:  { type: Number, default: 0 },
  behavioralSkills: { type: Number, default: 0 },
  professionalism:  { type: Number, default: 0 },
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole:         { type: String, required: true, trim: true },
  jobDescription:  { type: String, required: true },
  durationMinutes: { type: Number, required: true },   // chosen limit
  actualDuration:  { type: Number, default: 0 },       // seconds actually used
  qa:              { type: [QASchema], default: [] },
  scores:          { type: ScoresSchema, default: () => ({}) },
  strengths:       { type: [String], default: [] },
  improvements:    { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'evaluated'],
    default: 'in_progress',
  },
  completedAt: { type: Date },
}, { timestamps: true });

InterviewSessionSchema.index({ user: 1, createdAt: -1 });
InterviewSessionSchema.index({ status: 1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
