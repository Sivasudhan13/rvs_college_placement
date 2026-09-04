const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type:    {
    type: String,
    enum: ['MockTest','Training','Attendance','Placement','Company','Interview','Certificate','General','System'],
    default: 'General',
  },
  relatedId:   { type: mongoose.Schema.Types.ObjectId, default: null }, // e.g. mockTest._id
  relatedModel:{ type: String, default: '' }, // e.g. 'MockTest'
  actionUrl:   { type: String, default: '' }, // deep link

  isRead:    { type: Boolean, default: false },
  readAt:    { type: Date, default: null },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
