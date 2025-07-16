const puppeteer = require('puppeteer');
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
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const pagePath = url.replace(baseUrl, '') || '/';
      const filename = sanitizeFilename(pagePath) + `_${mode}.png`;
      const filepath = path.join(outDir, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      visited.add(url);
      count++;
      // Enhanced link extraction
      const links = await page.evaluate((base) => {
        const found = new Set();
        // <a href>
        document.querySelectorAll('a[href]')
          .forEach(a => { if (a.href.startsWith(base)) found.add(a.href); });
        // [data-href]
        document.querySelectorAll('[data-href]')
          .forEach(el => {
            try {
              const abs = new URL(el.getAttribute('data-href'), base).href;
              if (abs.startsWith(base)) found.add(abs);
            } catch {}
          });
        // onclick handlers that set location.href
        document.querySelectorAll('[onclick]').forEach(el => {
          const onclick = el.getAttribute('onclick') || '';
          const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
          if (match) {
            try {
              const abs = new URL(match[1], base).href;
              if (abs.startsWith(base)) found.add(abs);
            } catch {}
          }
        });
        // clickable elements (role=button, tabindex)
        document.querySelectorAll('[role=button], [tabindex]').forEach(el => {
          // Try href or data-href
          if (el.hasAttribute('href')) {
            try {
              const abs = new URL(el.getAttribute('href'), base).href;
              if (abs.startsWith(base)) found.add(abs);
            } catch {}
          }
          if (el.hasAttribute('data-href')) {
            try {
              const abs = new URL(el.getAttribute('data-href'), base).href;
              if (abs.startsWith(base)) found.add(abs);
            } catch {}
          }
        });
        return Array.from(found);
      }, baseUrl);
      for (const link of links) {
        if (!visited.has(link) && !toVisit.includes(link) && toVisit.length + visited.size < 10) {
          toVisit.push(link);
        }
      }
    } catch (err) {
      console.error('Failed to load:', url, err.message);
      continue;
    }
  }
  await browser.close();
}

module.exports = { takeScreenshots }; 