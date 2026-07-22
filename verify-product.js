// Verify product page renders properly
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('response', r => { if (r.status() >= 500 && !r.url().includes('?_rsc=')) errs.push(`HTTP${r.status()} ${r.url().substring(0,100)}`); });

  await page.goto('https://malaikanest.com/products/baby-shawl', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const bodyText = await page.locator('body').innerText();
  const h1 = await page.locator('h1').first().textContent();
  const allButtons = await page.locator('button').evaluateAll(els => els.map(e => ({ text: e.textContent?.trim().substring(0, 30), aria: e.getAttribute('aria-label'), type: e.getAttribute('type') })));
  const images = await page.locator('img').count();
  const allLinks = await page.locator('a[href*="/add"]').count();

  console.log('=== Product Page Verification ===');
  console.log('Body length:', bodyText.length);
  console.log('H1:', h1);
  console.log('Image count:', images);
  console.log('Console/Network errors:', errs.length);
  if (errs.length) errs.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 150)));
  console.log('\nButtons on page:');
  allButtons.forEach(b => console.log('  -', JSON.stringify(b)));
  console.log('\nSemantic text (first 500 chars):');
  console.log(bodyText.substring(0, 500));

  // Test the actual add to cart flow
  const addBtn = page.locator('button:has-text("Add to Cart")').first();
  if (await addBtn.count()) {
    console.log('\n=== Test Add to Cart ===');
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    const toast = await page.locator('[role="alert"], [class*="toast"]').count();
    console.log('Toast shown:', toast > 0);
    console.log('Errors after click:', errs.length);
  }

  // Take a screenshot
  await page.screenshot({ path: 'product-verified.png', fullPage: false });
  console.log('\nScreenshot saved: product-verified.png');

  await browser.close();
})();
