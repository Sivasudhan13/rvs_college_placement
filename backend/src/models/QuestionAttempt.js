const mongoose = require('mongoose');

const QuestionAttemptSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question:       { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion', required: true },
  selectedAnswer: { type: Number, default: -1 },
  correctAnswer:  { type: Number, required: true },
  isCorrect:      { type: Boolean, default: false },
  timeTaken:      { type: Number, default: 0 },
  testAttempt:    { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt' },
  mode:           { type: String, enum: ['practice', 'test', 'daily'], default: 'practice' },
}, { timestamps: true });

QuestionAttemptSchema.index({ user: 1, createdAt: -1 });
QuestionAttemptSchema.index({ user: 1, question: 1 });

module.exports = mongoose.model('QuestionAttempt', QuestionAttemptSchema);
