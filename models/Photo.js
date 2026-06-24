const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
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
  mimeType: {
    type: String,
    default: '',
  },
  latitude: {
    type: Number,
    default: 0,
  },
  longitude: {
    type: Number,
    default: 0,
  },
  dateTaken: {
    type: Date,
  },
  isVideo: {
    type: Boolean,
    default: false,
  },
  thumbnailPath: {
    type: String,
    default: '',
  },
  publicId: {
    type: String,
    default: '',
  },
  resourceType: {
    type: String,
    default: 'image',
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

photoSchema.index({ deviceId: 1, dateTaken: -1 });

module.exports = mongoose.model('Photo', photoSchema);

