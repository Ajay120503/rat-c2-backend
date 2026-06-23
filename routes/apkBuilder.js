const express = require('express');
const router = express.Router();
const { generateApkConfig, downloadConfig, getBuilderStatus } = require('../controllers/apkBuilderController');
const authMiddleware = require('../middleware/auth');

router.post('/generate', authMiddleware, generateApkConfig);
router.get('/status', getBuilderStatus);
router.post('/download-config', authMiddleware, downloadConfig);

module.exports = router;

