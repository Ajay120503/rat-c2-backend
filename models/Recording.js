const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  filePath: {
    type: String,
    default: '',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: 'audio/3gpp',
  },
  isUploaded: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

recordingSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('Recording', recordingSchema);

