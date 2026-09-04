const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionIndex:   { type: Number, required: true },
  selectedOptions: { type: [Number], default: [] }, // 0-based option indices
  isMarked:        { type: Boolean, default: false },
  timeTaken:       { type: Number, default: 0 }, // seconds per question
}, { _id: false });

const MockAttemptSchema = new mongoose.Schema({
  mockTest:   { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  answers:    { type: [AnswerSchema], default: [] },

  // Timing — server-side trust
  startedAt:  { type: Date, default: Date.now },
  submittedAt:{ type: Date },
  timeTaken:  { type: Number, default: 0 }, // seconds total

  status:     { type: String, enum: ['In Progress','Completed','Timed Out','Abandoned'], default: 'In Progress' },

  // Results (computed on submission)
  totalQuestions:  { type: Number, default: 0 },
  attempted:       { type: Number, default: 0 },
  correct:         { type: Number, default: 0 },
  wrong:           { type: Number, default: 0 },
  unanswered:      { type: Number, default: 0 },
  totalMarks:      { type: Number, default: 0 },
  scoredMarks:     { type: Number, default: 0 },
  negativeMarks:   { type: Number, default: 0 },
  finalScore:      { type: Number, default: 0 },
  percentage:      { type: Number, default: 0 },
  passed:          { type: Boolean, default: false },
  rank:            { type: Number, default: null },
}, { timestamps: true });

// One attempt per student per test (for default maxAttempts = 1)
MockAttemptSchema.index({ mockTest: 1, student: 1 });
MockAttemptSchema.index({ student: 1, createdAt: -1 });
MockAttemptSchema.index({ mockTest: 1, finalScore: -1 }); // leaderboard

module.exports = mongoose.model('MockAttempt', MockAttemptSchema);
