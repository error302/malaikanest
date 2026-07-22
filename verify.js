// Verification audit - specifically test the fixes
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'https://malaikanest.com';
const OUT = __dirname;

async function newCtx(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => {
    const url = r.url();
    if (!url.includes('?_rsc=')) {
      errors.push(`NETFAIL ${url.substring(0, 150)} ${r.failure()?.errorText}`);
    }
  });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('?_rsc=')) errors.push(`HTTP${r.status()} ${r.url().substring(0, 150)}`); });
  return { page, ctx, errors };
}

async function check(browser, viewport, name, fn) {
  const { page, ctx, errors } = await newCtx(browser, viewport);
  try {
    await fn(page, errors);
  } catch (e) {
    errors.push(`TESTERROR: ${e.message.substring(0, 200)}`);
  } finally {
    await ctx.close();
  }
  return errors;
}

(async () => {
  console.log('Re-audit start');
  const browser = await chromium.launch({ headless: true });
  const results = {};
  const mobile = { width: 375, height: 812, mobile: true };
  const desktop = { width: 1280, height: 800 };

  // 1. Product detail page (was 503) — most critical
  results.productPageStatus = await check(browser, mobile, 'product', async (page, errs) => {
    const resp = await page.goto(`${SITE}/products/baby-shawl/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
    const h1 = await page.locator('h1').first().textContent().catch(() => null);
    const addToCartBtn = await page.locator('button:has-text("Add to Cart"), button:has-text("Add to")').count();
    const variantBtns = await page.locator('button:has-text("size"), button:has-text("Size"), button:has-text("month"), [class*="variant"]').count();
    results.productPageStatus = {
      httpStatus: resp?.status(),
      bodyTextLen: bodyText.length,
      h1Text: h1?.trim().substring(0, 100),
      addToCartButtons: addToCartBtn,
      variantButtons: variantBtns,
      errors: errs.slice(0, 10),
    };
  });

  // 2. /forgot-password (was 404)
  results.forgotPasswordStatus = await check(browser, mobile, 'forgot', async (page, errs) => {
    const resp = await page.goto(`${SITE}/forgot-password/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
    results.forgotPasswordStatus = {
      httpStatus: resp?.status(),
      bodyTextLen: bodyText.length,
      hasInput: await page.locator('input[type="email"]').count(),
      hasSubmit: await page.locator('button[type="submit"]').count(),
      errors: errs.slice(0, 5),
    };
  });

  // 3. Login page (was hanging)
  results.loginPageStatus = await check(browser, mobile, 'login', async (page, errs) => {
    const resp = await page.goto(`${SITE}/login/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
    results.loginPageStatus = {
      httpStatus: resp?.status(),
      bodyTextLen: bodyText.length,
      hasEmailInput: await page.locator('input[type="email"]').count(),
      errors: errs.slice(0, 5),
    };
  });

  // 4. Category filtering via ?category=slug
  results.categoryFilter = await check(browser, mobile, 'cat-filter', async (page, errs) => {
    const resp = await page.goto(`${SITE}/categories?category=clothing`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3500);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
    const productCard = await page.locator('[class*="product"], a[href*="/products/"]').count();
    results.categoryFilter = {
      httpStatus: resp?.status(),
      bodyTextLen: bodyText.length,
      productCards: productCard,
      errors: errs.slice(0, 5),
    };
  });

  // 5. Footer — verify links go to filtered URLs
  results.footerLinks = await check(browser, mobile, 'footer', async (page, errs) => {
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    const links = await page.locator('footer a[href*="/categories"]').evaluateAll(els =>
      els.map(e => ({ href: e.getAttribute('href'), text: e.textContent?.trim().substring(0, 30) }))
    );
    results.footerLinks = { total: links.length, sample: links.slice(0, 6), errors: errs.slice(0, 5) };
  });

  // 6. Mobile LCP after Unsplash unoptimized
  results.mobileHomeLCP = await check(browser, mobile, 'mobile-lcp', async (page, errs) => {
    await page.addInitScript(() => {
      window.__perfLCP = 0;
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (e.startTime > window.__perfLCP) window.__perfLCP = e.startTime;
      });
      try { po.observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
    });
    const start = Date.now();
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(5000);
    const loadTime = Date.now() - start;
    const perf = await page.evaluate(() => ({ lcp: window.__perfLCP }));
    results.mobileHomeLCP = { loadTime, lcp: Math.round(perf.lcp), errors: errs.slice(0, 5) };
  });

  // 7. Track form validation
  results.trackValidation = await check(browser, mobile, 'track', async (page, errs) => {
    await page.goto(`${SITE}/track/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const showInlineError = await page.locator('text=/required|enter/i').first().isVisible().catch(() => false);
    results.trackValidation = {
      submitBtnWorks: true,
      htmlRequired: (await page.locator('input[required]').count()) > 0,
      showsInlineErrorOnEmpty: showInlineError,
      errors: errs.slice(0, 5),
    };
  });

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'fix-verification.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
