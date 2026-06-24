const Command = require('../models/Command');

/**
 * Socket.IO real-time handler.
 * 
 * Architecture:
 * - Devices connect and authenticate with their deviceId
 * - Admin panel connects and authenticates with JWT
 * - Commands are pushed to devices instantly (no polling)
 * - Device data/status updates are pushed to admin panel in real-time
 */

const deviceSockets = new Map(); // deviceId -> socket
const adminSockets = new Set();  // admin socket instances

function setupSocketIO(io) {
  // Authenticate device connections
  io.use((socket, next) => {
    const deviceId = socket.handshake.auth.deviceId;
    const token = socket.handshake.auth.token;

    if (deviceId) {
      // Device connection
      socket.deviceId = deviceId;
      return next();
    }

    if (token) {
      // Admin connection - verify JWT
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.adminId = decoded.id;
        return next();
      } catch (e) {
        return next(new Error('Invalid admin token'));
      }
    }

    next(new Error('Authentication required'));
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.deviceId ? `Device ${socket.deviceId}` : `Admin ${socket.adminId}`}`);

    // === DEVICE CONNECTION ===
    if (socket.deviceId) {
      // Register device socket
      deviceSockets.set(socket.deviceId, socket);
      
      // Notify all admins
      adminSockets.forEach((adminSocket) => {
        adminSocket.emit('device:online', { deviceId: socket.deviceId });
      });

      // Send any pending commands immediately
      sendPendingCommands(socket.deviceId, socket);

      // Device heartbeat
      socket.on('device:heartbeat', (data) => {
        socket.deviceId = data.deviceId || socket.deviceId;
        // Refresh pending commands on each heartbeat
        sendPendingCommands(socket.deviceId, socket);
      });

      // Command status update from device
      socket.on('command:status', async (data) => {
        try {
          const { commandId, status, result } = data;
          const update = { status };
          if (status === 'completed' || status === 'failed') {
            update.completedAt = new Date();
          }
          if (result) update.result = result;
          
          await Command.findByIdAndUpdate(commandId, update);
          
          // Push update to admin panels
          const updatedCommand = await Command.findById(commandId);
          adminSockets.forEach((adminSocket) => {
            adminSocket.emit('command:updated', {
              id: updatedCommand._id,
              type: updatedCommand.type,
              status: updatedCommand.status,
              deviceId: updatedCommand.deviceId,
              createdAt: updatedCommand.createdAt,
              completedAt: updatedCommand.completedAt,
            });
          });
        } catch (e) {
          console.error('[Socket] command status error:', e.message);
        }
      });

      // Device disconnect
      socket.on('disconnect', () => {
        deviceSockets.delete(socket.deviceId);
        adminSockets.forEach((adminSocket) => {
          adminSocket.emit('device:offline', { deviceId: socket.deviceId });
        });
        console.log(`[Socket] Device disconnected: ${socket.deviceId}`);
      });
    }

    // === ADMIN CONNECTION ===
    if (socket.adminId) {
      adminSockets.add(socket);
      
      socket.on('disconnect', () => {
        adminSockets.delete(socket);
        console.log(`[Socket] Admin disconnected: ${socket.adminId}`);
      });
    }
  });
}

/**
 * Send pending commands to a device via its socket.
 */
async function sendPendingCommands(deviceId, socket) {
  try {
    const pendingCommands = await Command.find({
      deviceId,
      status: { $in: ['pending', 'sent'] },
    }).sort({ createdAt: 1 });

    if (pendingCommands.length > 0) {
      socket.emit('commands:pending', pendingCommands.map((cmd) => ({
        id: cmd._id,
        type: cmd.type,
        params: cmd.params,
      })));
    }
  } catch (e) {
    console.error('[Socket] sendPendingCommands error:', e.message);
  }
}

/**
 * Push a new command to a device instantly.
 * Called from commandController after creating a command.
 */
function pushCommandToDevice(deviceId, command) {
  const socket = deviceSockets.get(deviceId);
  if (socket && socket.connected) {
    socket.emit('command:new', {
      id: command._id,
      type: command.type,
      params: command.params,
    });
    return true;
  }
  return false; // Device not connected via socket
}

/**
 * Notify admin panels about new data (photo, recording, etc.)
 */
function notifyAdmins(event, data) {
  adminSockets.forEach((socket) => {
    socket.emit(event, data);
  });
}

module.exports = {
  setupSocketIO,
  pushCommandToDevice,
  notifyAdmins,
  deviceSockets,
};