const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshots(url, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  const filename = path.join(outDir, 'screenshot.png');
  await page.screenshot({ path: filename, fullPage: true });
  await browser.close();
}

module.exports = { takeScreenshots }; 