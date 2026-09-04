const mongoose = require('mongoose');

const FollowUpSchema = new mongoose.Schema({
  date:     { type: Date, default: Date.now },
  notes:    { type: String, default: '' },
  status:   { type: String, default: '' },
  calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const TelecallingSchema = new mongoose.Schema({
  company:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // optional link
  organizationName: { type: String, required: true, trim: true },
  hrName:        { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  email:         { type: String, default: '' },
  location:      { type: String, default: '' },
  address:       { type: String, default: '' },
  domain:        { type: String, enum: ['Core','IT','Both'], default: 'IT' },
  callDate:      { type: Date, default: Date.now },
  callStatus:    {
    type: String,
    enum: ['Not Contacted','Called','Interested','Not Interested','Call Back','Email Sent','Meeting Scheduled','Drive Confirmed','Rejected'],
    default: 'Not Contacted',
  },
  nextFollowUpDate: { type: Date },
  remarks:       { type: String, default: '' },
  followUps:     { type: [FollowUpSchema], default: [] },
  driveCreated:  { type: Boolean, default: false },
  drive:         { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

TelecallingSchema.index({ callStatus: 1 });
TelecallingSchema.index({ nextFollowUpDate: 1 });

module.exports = mongoose.model('Telecalling', TelecallingSchema);
