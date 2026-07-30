const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLiveSite() {
  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });

  // Emulate Samsung Galaxy S22
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, Intl; Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\a3cfb8b1-bc89-4f3f-8973-5a95f385c0da';

  try {
    console.log('Navigating to https://malaikanest.com on Samsung S22...');
    await page.goto('https://malaikanest.com', { waitUntil: 'networkidle', timeout: 30000 });

    const screenshotPath = path.join(artifactDir, 's22_live_homepage.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved Samsung S22 Homepage screenshot to:', screenshotPath);

    // Verify navbar header elements
    const navbar = await page.$('header');
    if (navbar) {
      const headerScreenshot = path.join(artifactDir, 's22_live_header.png');
      await navbar.screenshot({ path: headerScreenshot });
      console.log('Saved Samsung S22 Header screenshot to:', headerScreenshot);
    }

    // Check images on homepage
    const images = await page.$$eval('img', imgs => imgs.map(img => ({ src: img.src, loaded: img.complete && img.naturalWidth > 0 })));
    console.log('Homepage Images Loaded Status:', images);

    // Navigate to categories page
    console.log('Navigating to categories page...');
    await page.goto('https://malaikanest.com/categories', { waitUntil: 'networkidle', timeout: 30000 });
    const catScreenshotPath = path.join(artifactDir, 's22_live_categories.png');
    await page.screenshot({ path: catScreenshotPath, fullPage: false });
    console.log('Saved Samsung S22 Categories screenshot to:', catScreenshotPath);

  } catch (err) {
    console.error('Playwright Test Error:', err);
  } finally {
    await browser.close();
  }
}

testLiveSite();
