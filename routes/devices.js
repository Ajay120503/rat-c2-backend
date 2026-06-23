const express = require('express');
const router = express.Router();
const {
  registerDevice,
  heartbeat,
  getAllDevices,
  getDevice,
  deleteDevice,
} = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

// Device-facing routes (unauthenticated - device registers with deviceId)
router.post('/register', registerDevice);
router.post('/heartbeat', heartbeat);

// Admin routes
router.get('/', authMiddleware, getAllDevices);
router.get('/:deviceId', authMiddleware, getDevice);
router.delete('/:deviceId', authMiddleware, deleteDevice);

module.exports = router;

