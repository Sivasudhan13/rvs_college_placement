const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  industry:    { type: String, default: '' },
  type:        { type: String, enum: ['IT','Core','Analytics','Consulting','Finance','Manufacturing','Healthcare','Startup','Other'], default: 'IT' },
  domain:      { type: String, enum: ['Core','IT','Both'], default: 'IT' },
  website:     { type: String, default: '' },
  location:    { type: String, default: '' },
  address:     { type: String, default: '' },
  hrName:      { type: String, default: '' },
  hrPhone:     { type: String, default: '' },
  hrEmail:     { type: String, default: '' },
  description: { type: String, default: '' },
  notes:       { type: String, default: '' },
  logo:        { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CompanySchema.index({ name: 1 });

module.exports = mongoose.model('Company', CompanySchema);
