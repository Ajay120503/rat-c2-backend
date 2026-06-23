const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  deviceName: {
    type: String,
    default: 'Unknown',
  },
  manufacturer: {
    type: String,
    default: 'Unknown',
  },
  model: {
    type: String,
    default: 'Unknown',
  },
  androidVersion: {
    type: String,
    default: 'Unknown',
  },
  sdkVersion: {
    type: Number,
    default: 0,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: '',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  firstConnected: {
    type: Date,
    default: Date.now,
  },
  batteryLevel: {
    type: Number,
    default: 0,
  },
  isCharging: {
    type: Boolean,
    default: false,
  },
  networkType: {
    type: String,
    default: '',
  },
  simInfo: {
    type: String,
    default: '',
  },
  totalStorage: {
    type: String,
    default: '',
  },
  usedStorage: {
    type: String,
    default: '',
  },
  installedApps: [{
    packageName: String,
    appName: String,
    versionName: String,
    firstInstallTime: Number,
  }],
  accounts: [{
    name: String,
    type: String,
  }],
  permissionsGranted: [{
    permission: String,
    granted: Boolean,
    timestamp: Date,
  }],
});

deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Device', deviceSchema);

