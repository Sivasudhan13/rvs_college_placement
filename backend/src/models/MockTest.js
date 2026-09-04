const mongoose = require('mongoose');

const MockQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  questionType:  { type: String, enum: ['MCQ','MultiSelect','TrueFalse'], default: 'MCQ' },
  options:       { type: [String], validate: { validator: v => v.length >= 2, message: 'At least 2 options required' } },
  correctAnswer: { type: [Number], required: true },   // 0-based indices (array to support MultiSelect)
  explanation:   { type: String, default: '' },
  marks:         { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  difficulty:    { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  category:      { type: String, default: '' },
  order:         { type: Number, default: 0 },
});

const MockTestSchema = new mongoose.Schema({
  title:              { type: String, required: true, trim: true },
  description:        { type: String, default: '' },
  instructions:       { type: String, default: '' },
  category:           {
    type: String,
    enum: ['Aptitude','Logical Reasoning','Verbal Ability','Quantitative Aptitude','Technical','Programming','Company Specific','Mixed'],
    default: 'Mixed',
  },
  difficulty:         { type: String, enum: ['Easy','Medium','Hard','Mixed'], default: 'Mixed' },
  duration:           { type: Number, required: true },   // minutes
  totalQuestions:     { type: Number, default: 0 },
  passingPercentage:  { type: Number, default: 60 },
  startDate:          { type: Date },
  endDate:            { type: Date },
  status:             { type: String, enum: ['Draft','Published','Closed','Archived'], default: 'Draft' },
  questions:          { type: [MockQuestionSchema], default: [] },
  maxAttempts:        { type: Number, default: 1 },
  showResult:         { type: Boolean, default: true },
  showAnswers:        { type: Boolean, default: false },  // admin controls if students see correct answers
  showLeaderboard:    { type: Boolean, default: true },

  // Target audience
  targetDepartments:  { type: [String], default: [] },
  targetBatches:      { type: [String], default: [] },
  targetYears:        { type: [Number], default: [] },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Denormalised stats
  totalAttempts:   { type: Number, default: 0 },
  averageScore:    { type: Number, default: 0 },
  passCount:       { type: Number, default: 0 },
}, { timestamps: true });

MockTestSchema.index({ status: 1 });
MockTestSchema.index({ category: 1 });

module.exports = mongoose.model('MockTest', MockTestSchema);
