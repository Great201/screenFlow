const { takeScreenshots } = require('../utils/screenshot');
const { zipFolder } = require('../utils/zip');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

exports.handleScreenshot = async (req, res) => {
  let { url, mode = 'desktop' } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'Invalid URL' });
  }
  // Normalize URL
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  if (!isValidUrl(url)) {
    return res.status(400).json({ message: 'Invalid URL' });
  }
  const jobId = uuidv4();
  const tmpDir = path.join(__dirname, '../tmp', jobId);
  try {
    let skipped = [];
    if (mode === 'both') {
      const skippedDesktop = await takeScreenshots(url, tmpDir, 'desktop');
      const skippedMobile = await takeScreenshots(url, tmpDir, 'mobile');
      skipped = [...(skippedDesktop || []), ...(skippedMobile || [])];
    } else {
      skipped = await takeScreenshots(url, tmpDir, mode);
    }
    const zipPath = path.join(__dirname, '../public', `screenshots_${jobId}.zip`);
    await zipFolder(tmpDir, zipPath);
    const downloadUrl = `/public/screenshots_${jobId}.zip`;
    res.json({ message: 'Success', downloadUrl, skipped });

    // Schedule deletion after 2 minutes
    setTimeout(() => {
      fs.rm(tmpDir, { recursive: true, force: true }, (err) => {
        if (err) console.error('Failed to delete tmpDir:', err);
      });
      fs.rm(zipPath, { force: true }, (err) => {
        if (err) console.error('Failed to delete zip file:', err);
      });
    }, 2 * 60 * 1000);
  } catch (err) {
    res.status(500).json({ message: 'Error taking screenshot', error: err.message });
  }
}; 