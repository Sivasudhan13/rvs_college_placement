const mongoose = require('mongoose');

const DSASubmissionSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem:       { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  language:      { type: String, enum: ['javascript', 'python', 'java', 'cpp'], required: true },
  sourceCode:    { type: String, required: true, maxlength: 65536 },
  status:        {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Pending'],
    default: 'Pending',
  },
  passedTests:   { type: Number, default: 0 },
  totalTests:    { type: Number, default: 0 },
  executionTime: { type: Number, default: 0 },  // ms
  memoryUsed:    { type: Number, default: 0 },  // MB
  errorMessage:  { type: String, default: '' },
  isRun:         { type: Boolean, default: false }, // true = "Run" (public tests only)
}, { timestamps: true });

DSASubmissionSchema.index({ user: 1, createdAt: -1 });
DSASubmissionSchema.index({ problem: 1, user: 1 });
DSASubmissionSchema.index({ user: 1, problem: 1, status: 1 });

module.exports = mongoose.model('DSASubmission', DSASubmissionSchema);
