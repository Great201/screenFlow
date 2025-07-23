const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'home';
}

async function takeScreenshots(startUrl, outDir, mode = 'desktop') {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], protocolTimeout: 120000 });
  const page = await browser.newPage();

  // Set viewport or emulate device
  if (mode === 'mobile') {
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );
  } else {
    await page.setViewport({ width: 1366, height: 768 });
  }

  const baseUrl = new URL(startUrl).origin;
  const visited = new Set();
  let count = 0;
  const skipped = [];

  // Visit the home page first
  try {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    const pagePath = new URL(page.url()).pathname || '/';
    const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
    const filepath = path.join(outDir, filename);
    try {
      await page.screenshot({ path: filepath, fullPage: true, timeout: 90000 });
    } catch (err) {
      // Fallback to viewport screenshot
      console.error('Full page screenshot failed, trying viewport:', page.url(), err.message);
      try {
        await page.screenshot({ path: filepath, fullPage: false, timeout: 90000 });
      } catch (err2) {
        console.error('Viewport screenshot also failed:', page.url(), err2.message);
        skipped.push({ url: page.url(), reason: err2.message });
      }
    }
    visited.add(page.url());
    count++;
  } catch (err) {
    console.error('Failed to load:', startUrl, err.message);
    skipped.push({ url: startUrl, reason: err.message });
    await browser.close();
    return skipped;
  }

  // Extract all unique internal links from the home page
  let links = await page.evaluate((base) => {
    const found = new Set();
    document.querySelectorAll('a[href]')
      .forEach(a => {
        if (a.href.startsWith(base)) found.add(a.href);
      });
    return Array.from(found);
  }, baseUrl);

  // Limit to 10 pages total (including home)
  links = links.filter(link => !visited.has(link)).slice(0, 10 - count);

  for (const link of links) {
    if (count >= 10) break;
    try {
      await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      const prevContent = await page.$eval('body', el => el.innerHTML);
      await page.evaluate((target) => {
        const a = Array.from(document.querySelectorAll('a[href]')).find(a => a.href === target);
        if (a) a.setAttribute('target', '_self');
      }, link);
      await page.evaluate((target) => {
        const a = Array.from(document.querySelectorAll('a[href]')).find(a => a.href === target);
        if (a) a.click();
      }, link);
      let navigated = false;
      try {
        await Promise.race([
          page.waitForFunction(url => window.location.href === url, { timeout: 15000 }, link),
          page.waitForFunction(prev => document.body.innerHTML !== prev, { timeout: 15000 }, prevContent)
        ]);
        navigated = true;
      } catch (e) {
        console.error('Navigation or DOM change did not occur for:', link);
        skipped.push({ url: link, reason: 'Navigation or DOM change did not occur' });
      }
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20000 }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pagePath = new URL(page.url()).pathname || '/';
      const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
      const filepath = path.join(outDir, filename);
      if (!visited.has(page.url()) && navigated) {
        try {
          await page.screenshot({ path: filepath, fullPage: true, timeout: 90000 });
        } catch (err) {
          // Fallback to viewport screenshot
          console.error('Full page screenshot failed, trying viewport:', page.url(), err.message);
          try {
            await page.screenshot({ path: filepath, fullPage: false, timeout: 90000 });
          } catch (err2) {
            console.error('Viewport screenshot also failed:', page.url(), err2.message);
            skipped.push({ url: page.url(), reason: err2.message });
          }
        }
        visited.add(page.url());
        count++;
      }
    } catch (err) {
      console.error('Failed to click or screenshot:', link, err.message);
      skipped.push({ url: link, reason: err.message });
    }
  }
  await browser.close();
  return skipped;
}

module.exports = { takeScreenshots }; 