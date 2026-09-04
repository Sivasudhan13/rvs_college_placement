const mongoose = require('mongoose');

const AptitudeTestSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  category:      {
    type: String,
    enum: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'Full'],
    default: 'Full',
  },
  duration:       { type: Number, required: true },  // minutes
  totalQuestions: { type: Number, required: true },
  marks:          { type: Number, default: 1 },      // per question
  negativeMarks:  { type: Number, default: 0.25 },
  difficulty:     { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
  questions:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' }],
  isPublished:    { type: Boolean, default: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Company tag
  company:        { type: String, default: '' },
}, { timestamps: true });

AptitudeTestSchema.index({ category: 1, isPublished: 1 });
AptitudeTestSchema.index({ company: 1 });

module.exports = mongoose.model('AptitudeTest', AptitudeTestSchema);
