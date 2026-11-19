import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function captureScrolled() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://malaikanest.com/', { waitUntil: 'networkidle' });

  // Scroll down to products
  await page.evaluate(() => window.scrollBy(0, 750));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'mobile-live-scrolled-mid.png' });

  // Scroll down to categories/bottom
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'mobile-live-scrolled-bottom.png' });

  await browser.close();
  console.log('Scrolled screenshots captured!');
}

captureScrolled().catch(console.error);
