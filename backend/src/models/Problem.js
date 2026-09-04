const mongoose = require('mongoose');

const ExampleSchema = new mongoose.Schema({
  input:       { type: String, default: '' },
  output:      { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: false });

const TestCaseSchema = new mongoose.Schema({
  input:          { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  isHidden:       { type: Boolean, default: false },
  explanation:    { type: String, default: '' },
});

const StarterCodeSchema = new mongoose.Schema({
  javascript: { type: String, default: '' },
  python:     { type: String, default: '' },
  java:       { type: String, default: '' },
  cpp:        { type: String, default: '' },
}, { _id: false });

const ProblemSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  description:  { type: String, required: true },
  difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category:     {
    type: String,
    enum: [
      'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Hashing',
      'Two Pointers', 'Sliding Window', 'Binary Search', 'Recursion',
      'Backtracking', 'Trees', 'Binary Search Tree', 'Heap',
      'Priority Queue', 'Graphs', 'Dynamic Programming', 'Greedy',
      'Bit Manipulation', 'Sorting', 'Searching', 'Math',
    ],
    required: true,
  },
  tags:          { type: [String], default: [] },
  constraints:   { type: String, default: '' },
  inputFormat:   { type: String, default: '' },
  outputFormat:  { type: String, default: '' },
  examples:      { type: [ExampleSchema], default: [] },
  starterCode:   { type: StarterCodeSchema, default: () => ({}) },
  testCases:     { type: [TestCaseSchema], default: [] },   // public
  hiddenTestCases:{ type: [TestCaseSchema], default: [] }, // hidden — never sent to client
  timeLimit:     { type: Number, default: 2000 },  // ms
  memoryLimit:   { type: Number, default: 256 },   // MB
  order:         { type: Number, required: true, unique: true },
  isPublished:   { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Stats (denormalised for speed)
  totalSubmissions: { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },
  totalAttempts:    { type: Number, default: 0 },
}, { timestamps: true });

ProblemSchema.index({ difficulty: 1, isPublished: 1 });
ProblemSchema.index({ category: 1, isPublished: 1 });

ProblemSchema.virtual('acceptanceRate').get(function () {
  if (!this.totalSubmissions) return 0;
  return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100);
});

module.exports = mongoose.model('Problem', ProblemSchema);
