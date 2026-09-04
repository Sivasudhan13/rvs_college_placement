const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: [true, 'Task title is required'], trim: true },
    description: { type: String, default: '' },
    category:    { type: String, enum: ['Assignment', 'Study', 'Career', 'Practice', 'Assessment', 'Other'], default: 'Study' },
    priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status:      { type: String, enum: ['Todo', 'In Progress', 'Completed'], default: 'Todo' },
    dueDate:     { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
