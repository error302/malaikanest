import { chromium, devices } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 14'],
  });
  const page = await context.newPage();
  await page.goto('https://malaikanest.com/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'mobile-storefront-viewport.png' });
  await page.screenshot({ path: 'mobile-storefront-full.png', fullPage: true });
  await browser.close();
  console.log('Mobile screenshots captured successfully!');
}

capture().catch(console.error);
