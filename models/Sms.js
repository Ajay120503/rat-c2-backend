const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['inbox', 'sent', 'draft'],
    default: 'inbox',
  },
  address: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
  },
  read: {
    type: Boolean,
    default: false,
  },
  serviceCenter: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

smsSchema.index({ deviceId: 1, date: -1 });

module.exports = mongoose.model('Sms', smsSchema);

