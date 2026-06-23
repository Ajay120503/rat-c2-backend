const express = require('express');
const router = express.Router();
const { login, getMe/*, seedAdmin*/ } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// router.post('/seed', seedAdmin);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

module.exports = router;

