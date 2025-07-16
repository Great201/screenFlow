const { takeScreenshots } = require('../utils/screenshot');
const { zipFolder } = require('../utils/zip');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

exports.handleScreenshot = async (req, res) => {
  const { url, mode = 'desktop' } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ message: 'Invalid URL' });
  }
  const jobId = uuidv4();
  const tmpDir = path.join(__dirname, '../tmp', jobId);
  try {
    if (mode === 'both') {
      await takeScreenshots(url, tmpDir, 'desktop');
      await takeScreenshots(url, tmpDir, 'mobile');
    } else {
      await takeScreenshots(url, tmpDir, mode);
    }
    const zipPath = path.join(__dirname, '../public', `screenshots_${jobId}.zip`);
    await zipFolder(tmpDir, zipPath);
    const downloadUrl = `/public/screenshots_${jobId}.zip`;
    res.json({ message: 'Success', downloadUrl });
  } catch (err) {
    res.status(500).json({ message: 'Error taking screenshot', error: err.message });
  }
}; 