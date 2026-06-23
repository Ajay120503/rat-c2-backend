const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
  },
  number: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  photoUri: {
    type: String,
    default: '',
  },
  rawContactId: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

contactSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Contact', contactSchema);

