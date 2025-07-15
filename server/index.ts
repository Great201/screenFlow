const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const INSTAWORK_EMAIL = "";
const INSTAWORK_PASSWORD = "";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome", // or chromium path
    headless: false,
  }); // Headless true if you want silent
  const page = await browser.newPage();

  const baseUrl = "https://www.instawork.com";

  // Step 1: Login
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle0", timeout: 120000 });

  await page.waitForSelector("#id_email");
  await page.type("#id_email", INSTAWORK_EMAIL);

  await page.waitForSelector("#id_password");
  await page.type("#id_password", INSTAWORK_PASSWORD);

  // Use safe hybrid login wait
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 120000 }),
      page.click('input[type="submit"]'),
    ]);
  } catch (err) {
    console.log("Navigation after login did not happen, waiting for dashboard selector fallback...");
    // Adjust this selector to something unique on the logged-in dashboard page
    await page.waitForSelector(".dashboard-main", { timeout: 120000 }).catch(() => {
      console.warn("Dashboard selector not found, continuing anyway...");
    });
  }

  console.log("Logged in, current URL:", page.url());

  // Step 3: Grab internal links from the dashboard (or wherever you land)
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a"));
    return anchors
      .map((a) => a.href)
      .filter(
        (href) =>
          href.startsWith(window.location.origin) &&
          !href.includes("logout") &&
          !href.includes("#") &&
          !href.startsWith("mailto:")
      );
  });

  // Remove duplicates and keep only unique paths
  const uniqueLinks = [...new Set(links)];

  // Step 4: Create folder for screenshots
  const dir = path.join(__dirname, "screenshots");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Step 5: Visit and screenshot each page
  for (const url of uniqueLinks) {
    try {
      await page.goto(url, { waitUntil: "networkidle0" });
      const pageSlug =
      url.replace(baseUrl, "").replace(/[^a-z0-9]/gi, "_") || "home";
      const filename = path.join(dir, `${pageSlug}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`Captured: ${url}`);
    } catch (e) {
      console.error(`Failed to capture ${url}:`, e.message);
    }
  }

  await browser.close();
})();
