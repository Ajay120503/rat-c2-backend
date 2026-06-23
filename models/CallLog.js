const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed', 'rejected'],
    default: 'incoming',
  },
  number: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

callLogSchema.index({ deviceId: 1, date: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);

