const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  altitude: {
    type: Number,
    default: 0,
  },
  speed: {
    type: Number,
    default: 0,
  },
  bearing: {
    type: Number,
    default: 0,
  },
  provider: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

locationSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('Location', locationSchema);

