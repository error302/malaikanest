import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function inspect() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://malaikanest.com/', { waitUntil: 'networkidle' });

  const dock = await page.$('.floating-bottom-dock');
  const dockBox = dock ? await dock.boundingBox() : null;
  const dockStyles = dock ? await page.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      position: s.position,
      bottom: s.bottom,
      top: s.top,
      zIndex: s.zIndex,
      transform: s.transform,
      display: s.display
    };
  }, dock) : null;

  const help = await page.$('.floating-help-box');
  const helpBox = help ? await help.boundingBox() : null;
  const helpStyles = help ? await page.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      position: s.position,
      bottom: s.bottom,
      top: s.top,
      zIndex: s.zIndex,
      display: s.display
    };
  }, help) : null;

  console.log('DOCK BOX:', dockBox);
  console.log('DOCK STYLES:', dockStyles);
  console.log('HELP BOX:', helpBox);
  console.log('HELP STYLES:', helpStyles);

  await browser.close();
}

inspect().catch(console.error);
