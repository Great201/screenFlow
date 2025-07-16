const puppeteer = require('puppeteer');
const { devices } = require('puppeteer');
const fs = require('fs');
const path = require('path');

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'home';
}

async function takeScreenshots(startUrl, outDir, mode = 'desktop') {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
  const toVisit = [startUrl];
  const visited = new Set();
  let count = 0;

  while (toVisit.length > 0 && count < 10) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
      const pagePath = url.replace(baseUrl, '') || '/';
      const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
      const filepath = path.join(outDir, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      visited.add(url);
      count++;
      // Extract internal links
      const links = await page.evaluate((base) => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href.startsWith(base));
      }, baseUrl);
      for (const link of links) {
        if (!visited.has(link) && !toVisit.includes(link) && toVisit.length + visited.size < 10) {
          toVisit.push(link);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  await browser.close();
}

module.exports = { takeScreenshots }; 