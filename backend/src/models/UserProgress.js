const mongoose = require('mongoose');

const SolvedProblemSchema = new mongoose.Schema({
  problem:       { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  solvedAt:      { type: Date, default: Date.now },
  difficulty:    { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  language:      { type: String },
  executionTime: { type: Number, default: 0 },
}, { _id: false });

const UserProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  solvedProblems:    { type: [SolvedProblemSchema], default: [] },
  attemptedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

  // Counts per difficulty
  easySolved:   { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved:   { type: Number, default: 0 },

  // Submission stats
  totalSubmissions:    { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },

  // Score
  score:        { type: Number, default: 0 },

  // Streak
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSolvedDate:{ type: Date, default: null },

  // Achievements
  achievements: [{ type: String }],
}, { timestamps: true });

UserProgressSchema.index({ score: -1 });

UserProgressSchema.virtual('totalSolved').get(function () {
  return this.easySolved + this.mediumSolved + this.hardSolved;
});

UserProgressSchema.virtual('acceptanceRate').get(function () {
  if (!this.totalSubmissions) return 0;
  return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100);
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
