const fs = require('fs');
const archiver = require('archiver');

function zipFolder(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting zip creation: ${sourceDir} -> ${outPath}`);
    
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const finalTimestamp = new Date().toISOString();
      console.log(`[${finalTimestamp}] Zip creation completed: ${archive.pointer()} bytes written to ${outPath}`);
      resolve();
    });
    
    output.on('error', (err) => {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] Output stream error during zip creation:`, err);
      reject(err);
    });
    
    archive.on('error', (err) => {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] Archive error during zip creation:`, err);
      console.error(`[${errorTimestamp}] Archive error details:`, {
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        path: err.path
      });
      reject(err);
    });
    
    archive.on('warning', (err) => {
      const warningTimestamp = new Date().toISOString();
      if (err.code === 'ENOENT') {
        console.warn(`[${warningTimestamp}] Archive warning (file not found):`, err);
      } else {
        console.warn(`[${warningTimestamp}] Archive warning:`, err);
      }
    });
    
    archive.on('progress', (progress) => {
      if (progress.entries.processed % 5 === 0) { // Log every 5 files to avoid spam
        console.log(`[${new Date().toISOString()}] Zip progress: ${progress.entries.processed}/${progress.entries.total} files processed`);
      }
    });
    
    try {
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
      console.log(`[${timestamp}] Archive finalization initiated`);
    } catch (err) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] Error during zip setup:`, err);
      reject(err);
    }
  });
}

module.exports = { zipFolder }; 