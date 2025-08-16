const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'home';
}

async function takeScreenshots(startUrl, outDir, mode = 'desktop') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] takeScreenshots started: URL=${startUrl}, mode=${mode}, outDir=${outDir}`);
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`[${timestamp}] Created output directory: ${outDir}`);
  }
  
  let browser;
  try {
    console.log(`[${timestamp}] Launching Puppeteer browser`);
    
    // Try to use system Chrome first, fallback to bundled version
    let launchOptions = {
      headless: true, 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ], 
      protocolTimeout: 120000 
    };
    
    // Try to find system Chrome installation
    const fs = require('fs');
    const possibleChromePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    for (const chromePath of possibleChromePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`[${timestamp}] Using system Chrome: ${chromePath}`);
        launchOptions.executablePath = chromePath;
        break;
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log(`[${timestamp}] Browser launched successfully`);
  } catch (err) {
    console.error(`[${timestamp}] Failed to launch browser:`, err);
    throw new Error(`Browser launch failed: ${err.message}`);
  }
  
  let page;
  try {
    page = await browser.newPage();
    console.log(`[${timestamp}] New page created`);
  } catch (err) {
    console.error(`[${timestamp}] Failed to create new page:`, err);
    await browser.close();
    throw new Error(`Page creation failed: ${err.message}`);
  }

  // Set viewport or emulate device
  try {
    if (mode === 'mobile') {
      await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      );
      console.log(`[${timestamp}] Mobile viewport and user agent set`);
    } else {
      await page.setViewport({ width: 1366, height: 768 });
      console.log(`[${timestamp}] Desktop viewport set`);
    }
  } catch (err) {
    console.error(`[${timestamp}] Failed to set viewport:`, err);
    await browser.close();
    throw new Error(`Viewport setup failed: ${err.message}`);
  }

  const baseUrl = new URL(startUrl).origin;
  const visited = new Set();
  let count = 0;
  const skipped = [];

  console.log(`[${timestamp}] Base URL determined: ${baseUrl}`);

  // Visit the home page first
  try {
    console.log(`[${timestamp}] Navigating to home page: ${startUrl}`);
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`[${timestamp}] Successfully loaded home page: ${page.url()}`);
    
    const pagePath = new URL(page.url()).pathname || '/';
    const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
    const filepath = path.join(outDir, filename);
    
    console.log(`[${timestamp}] Taking screenshot of home page: ${filename}`);
    try {
      await page.screenshot({ path: filepath, fullPage: true, timeout: 90000 });
      console.log(`[${timestamp}] Full page screenshot saved: ${filename}`);
    } catch (err) {
      // Fallback to viewport screenshot
      console.warn(`[${timestamp}] Full page screenshot failed for ${page.url()}: ${err.message}`);
      console.log(`[${timestamp}] Attempting viewport screenshot fallback`);
      try {
        await page.screenshot({ path: filepath, fullPage: false, timeout: 90000 });
        console.log(`[${timestamp}] Viewport screenshot saved: ${filename}`);
      } catch (err2) {
        console.error(`[${timestamp}] Viewport screenshot also failed for ${page.url()}: ${err2.message}`);
        skipped.push({ url: page.url(), reason: err2.message, type: 'screenshot_failed' });
      }
    }
    visited.add(page.url());
    count++;
    console.log(`[${timestamp}] Home page processed successfully. Count: ${count}`);
  } catch (err) {
    console.error(`[${timestamp}] Failed to load home page ${startUrl}: ${err.message}`);
    console.error(`[${timestamp}] Home page error stack:`, err.stack);
    skipped.push({ url: startUrl, reason: err.message, type: 'navigation_failed' });
    await browser.close();
    return skipped;
  }

  // Extract all unique internal links from the home page
  let links;
  try {
    console.log(`[${timestamp}] Extracting internal links from home page`);
    links = await page.evaluate((base) => {
      const found = new Set();
      document.querySelectorAll('a[href]')
        .forEach(a => {
          if (a.href.startsWith(base)) found.add(a.href);
        });
      return Array.from(found);
    }, baseUrl);
    
    console.log(`[${timestamp}] Found ${links.length} internal links`);
    
    // Limit to 10 pages total (including home)
    links = links.filter(link => !visited.has(link)).slice(0, 10 - count);
    console.log(`[${timestamp}] Will process ${links.length} additional links (total limit: 10)`);
  } catch (err) {
    console.error(`[${timestamp}] Failed to extract links: ${err.message}`);
    links = [];
  }

  for (const [index, link] of links.entries()) {
    if (count >= 10) {
      console.log(`[${timestamp}] Reached page limit (10), stopping`);
      break;
    }
    
    console.log(`[${timestamp}] Processing link ${index + 1}/${links.length}: ${link}`);
    
    try {
      console.log(`[${timestamp}] Navigating back to home page for link processing`);
      await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      const prevContent = await page.$eval('body', el => el.innerHTML);
      
      await page.evaluate((target) => {
        const a = Array.from(document.querySelectorAll('a[href]')).find(a => a.href === target);
        if (a) a.setAttribute('target', '_self');
      }, link);
      
      console.log(`[${timestamp}] Clicking link: ${link}`);
      await page.evaluate((target) => {
        const a = Array.from(document.querySelectorAll('a[href]')).find(a => a.href === target);
        if (a) a.click();
      }, link);
      
      let navigated = false;
      try {
        console.log(`[${timestamp}] Waiting for navigation or DOM change`);
        await Promise.race([
          page.waitForFunction(url => window.location.href === url, { timeout: 15000 }, link),
          page.waitForFunction(prev => document.body.innerHTML !== prev, { timeout: 15000 }, prevContent)
        ]);
        navigated = true;
        console.log(`[${timestamp}] Navigation/DOM change detected for: ${link}`);
      } catch (e) {
        console.warn(`[${timestamp}] Navigation or DOM change did not occur for: ${link} - ${e.message}`);
        skipped.push({ url: link, reason: 'Navigation or DOM change did not occur', type: 'navigation_timeout' });
      }
      
      try {
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20000 });
        console.log(`[${timestamp}] Network idle achieved for: ${link}`);
      } catch (e) {
        console.warn(`[${timestamp}] Network idle timeout for: ${link}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pagePath = new URL(page.url()).pathname || '/';
      const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
      const filepath = path.join(outDir, filename);
      
      if (!visited.has(page.url()) && navigated) {
        console.log(`[${timestamp}] Taking screenshot of: ${page.url()} -> ${filename}`);
        try {
          await page.screenshot({ path: filepath, fullPage: true, timeout: 90000 });
          console.log(`[${timestamp}] Full page screenshot saved for: ${page.url()}`);
        } catch (err) {
          // Fallback to viewport screenshot
          console.warn(`[${timestamp}] Full page screenshot failed for ${page.url()}: ${err.message}`);
          console.log(`[${timestamp}] Attempting viewport screenshot fallback`);
          try {
            await page.screenshot({ path: filepath, fullPage: false, timeout: 90000 });
            console.log(`[${timestamp}] Viewport screenshot saved for: ${page.url()}`);
          } catch (err2) {
            console.error(`[${timestamp}] Viewport screenshot also failed for ${page.url()}: ${err2.message}`);
            skipped.push({ url: page.url(), reason: err2.message, type: 'screenshot_failed' });
          }
        }
        visited.add(page.url());
        count++;
        console.log(`[${timestamp}] Page processed successfully. Count: ${count}`);
      } else {
        if (visited.has(page.url())) {
          console.log(`[${timestamp}] Page already visited: ${page.url()}`);
        }
        if (!navigated) {
          console.log(`[${timestamp}] Navigation failed, skipping screenshot`);
        }
      }
    } catch (err) {
      console.error(`[${timestamp}] Failed to click or screenshot link ${link}: ${err.message}`);
      console.error(`[${timestamp}] Link processing error stack:`, err.stack);
      skipped.push({ url: link, reason: err.message, type: 'processing_failed' });
    }
  }
  
  console.log(`[${timestamp}] Screenshot process completed. Total pages: ${count}, Skipped: ${skipped.length}`);
  
  try {
    await browser.close();
    console.log(`[${timestamp}] Browser closed successfully`);
  } catch (err) {
    console.error(`[${timestamp}] Error closing browser: ${err.message}`);
  }
  
  return skipped;
}

module.exports = { takeScreenshots }; 