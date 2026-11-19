import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('https://malaikanest.com/products/organic-ribbed-sleepsuit/');
  await page.waitForLoadState('networkidle');
  
  const inner = await page.evaluate(() => {
    const a = document.querySelector('.nest-sticky-cta a');
    return Array.from(a.childNodes).map(n => ({
      type: n.nodeType,
      name: n.nodeName,
      text: n.textContent,
      rect: n.nodeType === 1 ? n.getBoundingClientRect() : null
    }));
  });
  console.log('Nodes in a:', JSON.stringify(inner, null, 2));
  await browser.close();
}

run().catch(console.error);
