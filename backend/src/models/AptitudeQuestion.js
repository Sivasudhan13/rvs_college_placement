const mongoose = require('mongoose');

const AptitudeQuestionSchema = new mongoose.Schema({
  title:      { type: String, trim: true, default: '' },
  question:   { type: String, required: true, trim: true },
  category:   {
    type: String,
    required: true,
    enum: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
  },
  subCategory: {
    type: String,
    required: true,
    trim: true,
    // All sub-categories from the spec — enforced only at seed level
  },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  options: {
    type: [String],
    validate: { validator: (v) => v.length === 4, message: 'Exactly 4 options required' },
    required: true,
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 }, // 0-based index
  explanation:   { type: String, default: '' },
  hint:          { type: String, default: '' },
  marks:         { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
  timeLimit:     { type: Number, default: 60 }, // seconds
  tags:          { type: [String], default: [] },
  isPublished:   { type: Boolean, default: true },
  order:         { type: Number, default: 0 },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Denormalised stats
  totalAttempts:  { type: Number, default: 0 },
  correctAttempts:{ type: Number, default: 0 },
}, { timestamps: true });

AptitudeQuestionSchema.index({ category: 1, isPublished: 1 });
AptitudeQuestionSchema.index({ subCategory: 1 });
AptitudeQuestionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('AptitudeQuestion', AptitudeQuestionSchema);
