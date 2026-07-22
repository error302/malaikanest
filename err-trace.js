// Detailed test - check what errors appear after add to cart
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('?_rsc=')) errs.push(`HTTP${r.status()} ${r.url().substring(0,200)}`); });

  await page.goto('https://malaikanest.com/products/baby-shawl', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('Errors BEFORE click:', errs.length);
  errs.forEach(e => console.log('  -', e.substring(0, 200)));
  const beforeErrs = [...errs];

  // Click add to cart
  const addBtn = page.locator('button:has-text("Add to Cart")').first();
  await addBtn.click({ timeout: 5000 });
  await page.waitForTimeout(3000);

  console.log('\nErrors AFTER add-to-cart click:', errs.length - beforeErrs.length);
  errs.slice(beforeErrs.length).forEach(e => console.log('  -', e.substring(0, 200)));

  await browser.close();
})();
