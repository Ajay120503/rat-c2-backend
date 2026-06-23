const express = require('express');
const router = express.Router();
const { sendCommand, getDeviceCommands, broadcastCommand } = require('../controllers/commandController');
const authMiddleware = require('../middleware/auth');

router.post('/send', authMiddleware, sendCommand);
router.post('/broadcast', authMiddleware, broadcastCommand);
router.get('/:deviceId', authMiddleware, getDeviceCommands);

module.exports = router;

