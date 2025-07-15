const express = require('express');
const router = express.Router();
const { handleScreenshot } = require('../controllers/screenshot.controller');

router.post('/screenshot', handleScreenshot);

module.exports = router; 