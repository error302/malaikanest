import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function testDockScroll() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://malaikanest.com/', { waitUntil: 'networkidle' });

  // Scroll the dock track horizontally to the right
  await page.evaluate(() => {
    const track = document.querySelector('.dock-track');
    if (track) {
      track.scrollLeft = 200;
    }
  });

  await page.waitForTimeout(300);
  await page.screenshot({ path: 'mobile-dock-scrolled.png' });

  const scrollInfo = await page.evaluate(() => {
    const track = document.querySelector('.dock-track');
    return {
      scrollWidth: track ? track.scrollWidth : 0,
      clientWidth: track ? track.clientWidth : 0,
      scrollLeft: track ? track.scrollLeft : 0
    };
  });

  console.log('DOCK SCROLL INFO:', scrollInfo);
  await browser.close();
}

testDockScroll().catch(console.error);
