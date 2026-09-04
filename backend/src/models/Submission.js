const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionIndex: Number,
  selectedOption: Number,   // -1 = skipped
  isCorrect: Boolean,
  marksAwarded: Number,
});

const SubmissionSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz:          { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers:       { type: [AnswerSchema], default: [] },
    score:         { type: Number, default: 0 },
    totalMarks:    { type: Number, default: 0 },
    correctCount:  { type: Number, default: 0 },
    wrongCount:    { type: Number, default: 0 },
    skippedCount:  { type: Number, default: 0 },
    timeTaken:     { type: Number, default: 0 },   // seconds
    status:        { type: String, enum: ['Completed', 'In Progress', 'Timed Out'], default: 'Completed' },
    percentage:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One submission per user per quiz (upsert allowed for retakes)
SubmissionSchema.index({ user: 1, quiz: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
