const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion', required: true },
  selectedAnswer: { type: Number, default: -1 },   // -1 = skipped
  isCorrect:      { type: Boolean, default: false },
  marksAwarded:   { type: Number, default: 0 },
  timeTaken:      { type: Number, default: 0 },    // seconds
  markedForReview:{ type: Boolean, default: false },
}, { _id: false });

const TestAttemptSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test:             { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTest', required: true },
  answers:          { type: [AnswerSchema], default: [] },
  totalQuestions:   { type: Number, default: 0 },
  correctAnswers:   { type: Number, default: 0 },
  wrongAnswers:     { type: Number, default: 0 },
  skippedQuestions: { type: Number, default: 0 },
  score:            { type: Number, default: 0 },
  maxScore:         { type: Number, default: 0 },
  percentage:       { type: Number, default: 0 },
  accuracy:         { type: Number, default: 0 },
  timeTaken:        { type: Number, default: 0 },   // seconds
  status:           { type: String, enum: ['In Progress', 'Completed', 'Timed Out'], default: 'In Progress' },
  startedAt:        { type: Date, default: Date.now },
  completedAt:      { type: Date },

  // Category breakdown
  categoryStats: [{
    category:  String,
    correct:   { type: Number, default: 0 },
    wrong:     { type: Number, default: 0 },
    skipped:   { type: Number, default: 0 },
    total:     { type: Number, default: 0 },
  }],
}, { timestamps: true });

TestAttemptSchema.index({ user: 1, createdAt: -1 });
TestAttemptSchema.index({ user: 1, test: 1 });

module.exports = mongoose.model('TestAttempt', TestAttemptSchema);
