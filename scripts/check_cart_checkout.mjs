import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  // 1. Visit PDP and add to cart
  console.log('Visiting PDP...');
  await page.goto('https://malaikanest.com/products/organic-ribbed-sleepsuit/');
  await page.waitForLoadState('networkidle');
  
  // Submit add to cart form
  console.log('Adding to cart...');
  await page.click('button[form="pdp-add-form"]');
  await page.waitForLoadState('networkidle');
  console.log('Current URL after add:', page.url());

  // 2. Check Cart Page
  await page.goto('https://malaikanest.com/cart/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'mobile-cart-live.png' });

  const cartLayout = await page.evaluate(() => {
    const dock = document.querySelector('.floating-bottom-dock');
    const help = document.querySelector('.floating-help-box');
    const stickyCta = document.querySelector('.nest-sticky-cta');
    return {
      dock: dock ? { y: dock.getBoundingClientRect().y, bottom: window.innerHeight - dock.getBoundingClientRect().bottom, height: dock.getBoundingClientRect().height, display: getComputedStyle(dock).display } : null,
      help: help ? { y: help.getBoundingClientRect().y, bottom: window.innerHeight - help.getBoundingClientRect().bottom, height: help.getBoundingClientRect().height, display: getComputedStyle(help).display } : null,
      stickyCta: stickyCta ? { y: stickyCta.getBoundingClientRect().y, bottom: window.innerHeight - stickyCta.getBoundingClientRect().bottom, height: stickyCta.getBoundingClientRect().height, display: getComputedStyle(stickyCta).display } : null,
    };
  });
  console.log('Cart Layout:', JSON.stringify(cartLayout, null, 2));

  // 3. Check Checkout Page
  await page.goto('https://malaikanest.com/checkout/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'mobile-checkout-live.png' });

  const checkoutLayout = await page.evaluate(() => {
    const dock = document.querySelector('.floating-bottom-dock');
    const help = document.querySelector('.floating-help-box');
    const stickyCta = document.querySelector('.nest-sticky-cta');
    return {
      dock: dock ? { y: dock.getBoundingClientRect().y, bottom: window.innerHeight - dock.getBoundingClientRect().bottom, height: dock.getBoundingClientRect().height, display: getComputedStyle(dock).display } : null,
      help: help ? { y: help.getBoundingClientRect().y, bottom: window.innerHeight - help.getBoundingClientRect().bottom, height: help.getBoundingClientRect().height, display: getComputedStyle(help).display } : null,
      stickyCta: stickyCta ? { y: stickyCta.getBoundingClientRect().y, bottom: window.innerHeight - stickyCta.getBoundingClientRect().bottom, height: stickyCta.getBoundingClientRect().height, display: getComputedStyle(stickyCta).display } : null,
    };
  });
  console.log('Checkout Layout:', JSON.stringify(checkoutLayout, null, 2));

  await browser.close();
}

run().catch(console.error);
