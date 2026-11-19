import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function checkRules() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://malaikanest.com/', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const el = document.querySelector('.floating-bottom-dock');
    const matched = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && el.matches(rule.selectorText)) {
            matched.push({ selector: rule.selectorText, cssText: rule.cssText });
          }
        }
      } catch (e) {}
    }
    return matched;
  });

  console.log('MATCHED RULES FOR DOCK:');
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}

checkRules().catch(console.error);
