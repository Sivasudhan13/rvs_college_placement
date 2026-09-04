const mongoose = require('mongoose');

const CategoryStatSchema = new mongoose.Schema({
  category:  { type: String, required: true },
  attempted: { type: Number, default: 0 },
  correct:   { type: Number, default: 0 },
  wrong:     { type: Number, default: 0 },
}, { _id: false });

const AptitudeProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Global counters
  totalAttempted:  { type: Number, default: 0 },
  totalCorrect:    { type: Number, default: 0 },
  totalWrong:      { type: Number, default: 0 },
  testsCompleted:  { type: Number, default: 0 },
  totalPoints:     { type: Number, default: 0 },

  // Best / avg test score
  bestScore:       { type: Number, default: 0 },
  avgScore:        { type: Number, default: 0 },

  // Category breakdown
  categoryStats:   { type: [CategoryStatSchema], default: [] },

  // Streak
  currentStreak:   { type: Number, default: 0 },
  longestStreak:   { type: Number, default: 0 },
  lastActivityDate:{ type: Date, default: null },

  // Daily challenge
  dailyChallengeCompleted: [{ type: String }], // ISO date strings "YYYY-MM-DD"
}, { timestamps: true });

AptitudeProgressSchema.index({ totalPoints: -1 });

module.exports = mongoose.model('AptitudeProgress', AptitudeProgressSchema);
