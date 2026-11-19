import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('https://malaikanest.com/products/organic-ribbed-sleepsuit/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'mobile-pdp-organic.png' });
  
  // Check positions of dock, help box, and sticky CTA
  const layout = await page.evaluate(() => {
    const dock = document.querySelector('.floating-bottom-dock');
    const help = document.querySelector('.floating-help-box');
    const stickyCta = document.querySelector('.nest-sticky-cta');
    return {
      dock: dock ? { y: dock.getBoundingClientRect().y, bottom: window.innerHeight - dock.getBoundingClientRect().bottom, height: dock.getBoundingClientRect().height, display: getComputedStyle(dock).display } : null,
      help: help ? { y: help.getBoundingClientRect().y, bottom: window.innerHeight - help.getBoundingClientRect().bottom, height: help.getBoundingClientRect().height, display: getComputedStyle(help).display } : null,
      stickyCta: stickyCta ? { y: stickyCta.getBoundingClientRect().y, bottom: window.innerHeight - stickyCta.getBoundingClientRect().bottom, height: stickyCta.getBoundingClientRect().height, display: getComputedStyle(stickyCta).display } : null,
    };
  });
  console.log('PDP Layout evaluation:', JSON.stringify(layout, null, 2));
  await browser.close();
}

run().catch(console.error);
