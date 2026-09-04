const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText:  { type: String, required: true },
  code:          { type: String, default: '' },
  options:       { type: [String], required: true },
  correctAnswer: { type: Number, required: true },      // 0-based index
  marks:         { type: Number, default: 4 },
  negativeMarks: { type: Number, default: 1 },
  explanation:   { type: String, default: '' },
  difficulty:    { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
});

const QuizSchema = new mongoose.Schema(
  {
    title:          { type: String, required: [true, 'Title is required'], trim: true },
    category:       { type: String, required: true, enum: ['Aptitude', 'Technical', 'HR / Soft Skills', 'Coding', 'Reasoning'] },
    difficulty:     { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    duration:       { type: Number, required: true },   // minutes
    totalQuestions: { type: Number, required: true },
    description:    { type: String, default: '' },
    tags:           { type: [String], default: [] },
    questions:      { type: [QuestionSchema], default: [] },
    isPublished:    { type: Boolean, default: true },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', QuizSchema);
