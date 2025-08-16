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
  const timestamp = new Date().toISOString();
  let { url, mode = 'desktop' } = req.body;
  
  console.log(`[${timestamp}] Screenshot request started - URL: ${url}, Mode: ${mode}`);
  
  if (!url) {
    console.warn(`[${timestamp}] Bad request: Missing URL`);
    return res.status(400).json({ 
      message: 'Invalid URL', 
      error: 'URL parameter is required',
      timestamp: timestamp 
    });
  }
  
  // Normalize URL
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
    console.log(`[${timestamp}] URL normalized to: ${url}`);
  }
  
  if (!isValidUrl(url)) {
    console.warn(`[${timestamp}] Bad request: Invalid URL format - ${url}`);
    return res.status(400).json({ 
      message: 'Invalid URL', 
      error: 'URL format is invalid',
      url: url,
      timestamp: timestamp 
    });
  }
  
  const jobId = uuidv4();
  const tmpDir = path.join(__dirname, '../tmp', jobId);
  
  console.log(`[${timestamp}] Job ${jobId} started for ${url}`);
  
  try {
    let skipped = [];
    if (mode === 'both') {
      console.log(`[${timestamp}] Job ${jobId}: Taking screenshots for both desktop and mobile`);
      const skippedDesktop = await takeScreenshots(url, tmpDir, 'desktop');
      const skippedMobile = await takeScreenshots(url, tmpDir, 'mobile');
      skipped = [...(skippedDesktop || []), ...(skippedMobile || [])];
      console.log(`[${timestamp}] Job ${jobId}: Desktop skipped: ${skippedDesktop?.length || 0}, Mobile skipped: ${skippedMobile?.length || 0}`);
    } else {
      console.log(`[${timestamp}] Job ${jobId}: Taking screenshots for ${mode} mode`);
      skipped = await takeScreenshots(url, tmpDir, mode);
      console.log(`[${timestamp}] Job ${jobId}: Skipped ${skipped?.length || 0} pages`);
    }
    
    console.log(`[${timestamp}] Job ${jobId}: Starting zip creation`);
    const zipPath = path.join(__dirname, '../public', `screenshots_${jobId}.zip`);
    await zipFolder(tmpDir, zipPath);
    console.log(`[${timestamp}] Job ${jobId}: Zip created successfully at ${zipPath}`);
    
    const downloadUrl = `/public/screenshots_${jobId}.zip`;
    console.log(`[${timestamp}] Job ${jobId}: Success! Download URL: ${downloadUrl}`);
    
    res.json({ 
      message: 'Success', 
      downloadUrl, 
      skipped,
      jobId: jobId,
      timestamp: timestamp
    });

    // Schedule deletion after 2 minutes
    setTimeout(() => {
      console.log(`[${new Date().toISOString()}] Job ${jobId}: Cleaning up temporary files`);
      fs.rm(tmpDir, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] Job ${jobId}: Failed to delete tmpDir:`, err);
        } else {
          console.log(`[${new Date().toISOString()}] Job ${jobId}: Temporary directory deleted`);
        }
      });
      fs.rm(zipPath, { force: true }, (err) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] Job ${jobId}: Failed to delete zip file:`, err);
        } else {
          console.log(`[${new Date().toISOString()}] Job ${jobId}: Zip file deleted`);
        }
      });
    }, 2 * 60 * 1000);
  } catch (err) {
    console.error(`[${timestamp}] Job ${jobId}: Error occurred:`, err);
    console.error(`[${timestamp}] Job ${jobId}: Error message:`, err.message);
    console.error(`[${timestamp}] Job ${jobId}: Error stack:`, err.stack);
    
    // Try to provide more specific error information
    let errorDetails = {
      message: 'Error taking screenshot',
      error: err.message,
      jobId: jobId,
      url: url,
      mode: mode,
      timestamp: timestamp
    };
    
    // Check for specific error types
    if (err.message.includes('TimeoutError')) {
      errorDetails.errorType = 'timeout';
      errorDetails.suggestion = 'The website took too long to respond. Try again or check if the URL is accessible.';
    } else if (err.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      errorDetails.errorType = 'dns_resolution';
      errorDetails.suggestion = 'Could not resolve the domain name. Please check the URL.';
    } else if (err.message.includes('net::ERR_CONNECTION_REFUSED')) {
      errorDetails.errorType = 'connection_refused';
      errorDetails.suggestion = 'Connection was refused by the server. The website might be down.';
    } else if (err.message.includes('net::ERR_CERT_')) {
      errorDetails.errorType = 'ssl_certificate';
      errorDetails.suggestion = 'SSL certificate error. The website might have certificate issues.';
    } else if (err.code === 'ENOENT') {
      errorDetails.errorType = 'file_system';
      errorDetails.suggestion = 'File system error occurred during screenshot processing.';
    } else if (err.code === 'EACCES') {
      errorDetails.errorType = 'permission';
      errorDetails.suggestion = 'Permission denied. Server may lack necessary file system permissions.';
    }
    
    console.error(`[${timestamp}] Job ${jobId}: Error details:`, errorDetails);
    
    res.status(500).json(errorDetails);
  }
}; 