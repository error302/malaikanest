// Live site audit for malaikanest.com
// Runs against mobile (375x667), tablet (768x1024), desktop (1280x800)
// Captures: per-page console errors, network 4xx/5xx, broken images,
// CLS/LCP via PerformanceObserver, hydration warnings, button interactivity

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'https://malaikanest.com';
const OUT = __dirname;
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'categories', path: '/categories' },
  { name: 'best-sellers', path: '/best-sellers' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
  { name: 'wishlist', path: '/wishlist' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'account', path: '/account' },
  { name: 'account-orders', path: '/account/orders' },
  { name: 'track', path: '/track' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'faq', path: '/faq' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
];

async function auditPage(browser, viewport, pageDef) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.name === 'mobile'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await context.newPage();

  const result = {
    page: pageDef.name,
    path: pageDef.path,
    viewport: viewport.name,
    url: `${SITE}${pageDef.path}`,
    status: null,
    redirect: null,
    title: null,
    h1: null,
    loadTime: null,
    lcp: null,
    cls: null,
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    brokenImages: [],
    hydrationWarnings: [],
    buttons: { total: 0, withHandler: 0, withoutHandler: 0 },
    links: { total: 0, internal: 0, external: 0, hashOrEmpty: 0 },
    forms: { total: 0, inputs: 0 },
    screenshot: null,
    bodyTextLength: 0,
    has500: false,
    has404: false,
    error: null,
  };

  try {
    // Set up listeners BEFORE navigation
    const consoleMessages = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') result.consoleErrors.push(text);
      if (msg.type() === 'warning') result.consoleWarnings.push(text);
      if (/hydration|Hydration|did not match|Text content does not match/i.test(text)) {
        result.hydrationWarnings.push(text);
      }
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      const failure = req.failure()?.errorText || 'unknown';
      result.networkErrors.push({ url, failure });
    });

    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();
      if (status >= 400) {
        result.networkErrors.push({ url: url.substring(0, 200), status });
        if (status === 404) result.has404 = true;
        if (status >= 500) result.has500 = true;
      }
    });

    // Performance observers
    const lcpEntries = [];
    const clsEntries = [];
    await page.addInitScript(() => {
      window.__perfLCP = 0;
      window.__perfCLS = 0;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime > window.__perfLCP) {
            window.__perfLCP = entry.startTime;
          }
        }
      });
      try { po.observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput === false) {
            window.__perfCLS += entry.value;
          }
        }
      });
      try { clsObs.observe({ type: 'layout-shift', buffered: true }); } catch {}
    });

    // Navigate
    const start = Date.now();
    const response = await page.goto(result.url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    result.loadTime = Date.now() - start;
    result.status = response?.status() || null;
    if (response && response.url() !== result.url) {
      result.redirect = response.url();
    }

    // Wait for potentially client-rendered content
    await page.waitForTimeout(2500);

    // Performance metrics
    try {
      const perf = await page.evaluate(() => ({
        lcp: window.__perfLCP,
        cls: window.__perfCLS,
      }));
      result.lcp = Math.round(perf.lcp);
      result.cls = Number(perf.cls.toFixed(3));
    } catch {}

    // Page metadata
    result.title = await page.title().catch(() => null);
    result.h1 = await page.locator('h1').first().textContent().catch(() => null);
    result.bodyTextLength = (await page.locator('body').innerText().catch(() => '')).trim().length;

    // Broken images
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src').catch(() => null);
      const naturalWidth = await img.evaluate((el) => el.naturalWidth).catch(() => 0);
      if (src && naturalWidth === 0) {
        result.brokenImages.push(src.substring(0, 150));
      }
    }

    // Buttons & handlers
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a.btn, a.button'));
      let total = buttons.length;
      let withHandler = 0;
      buttons.forEach((b) => {
        // Heuristic: onclick attr, or part of form (submit), or has type=submit
        if (b.hasAttribute('onclick') || b.type === 'submit' || b.closest('form')) {
          withHandler++;
        }
      });
      return { total, withHandler, withoutHandler: total - withHandler };
    });
    result.buttons = buttonInfo;

    // Links
    const linkInfo = await page.evaluate((origin) => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      let internal = 0, external = 0, hashOrEmpty = 0, broken = 0;
      links.forEach((l) => {
        const href = l.getAttribute('href') || '';
        if (!href || href === '#' || href.startsWith('javascript:')) {
          hashOrEmpty++;
        } else if (href.startsWith('http')) {
          if (href.includes(origin)) internal++; else external++;
        } else {
          internal++;
        }
      });
      return { total: links.length, internal, external, hashOrEmpty };
    }, new URL(SITE).origin);
    result.links = linkInfo;

    // Forms
    const formInfo = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const inputs = document.querySelectorAll('input, textarea, select').length;
      return { total: forms.length, inputs };
    });
    result.forms = formInfo;

    // Screenshot on error or first page
    if (result.has500 || result.has404 || viewport.name === 'mobile') {
      const screenshotPath = path.join(OUT, `${pageDef.name}-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      result.screenshot = path.basename(screenshotPath);
    }

    // Specific interactive tests
    if (pageDef.name === 'home' && viewport.name === 'mobile') {
      // Test hamburger menu
      const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu"]').first();
      if (await hamburger.count()) {
        await hamburger.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(1000);
        const menuVisible = await page.locator('nav, [role="navigation"]').first().isVisible().catch(() => false);
        result.hamburgerMenu = { found: true, menuVisible };
      } else {
        result.hamburgerMenu = { found: false };
      }
    }

    if (pageDef.name === 'cart') {
      // Check if cart shows empty state
      const emptyText = await page.locator('text=/empty/i').first().isVisible().catch(() => false);
      result.cartEmpty = emptyText;
    }

    if (pageDef.name === 'checkout') {
      // Check form fields exist
      const emailField = await page.locator('input[type="email"], input[name*="email" i]').count();
      const phoneField = await page.locator('input[type="tel"], input[name*="phone" i]').count();
      const submitBtn = await page.locator('button[type="submit"]').count();
      result.checkoutForm = { emailField, phoneField, submitBtn };
    }

    if (pageDef.name === 'best-sellers') {
      // Check product cards
      const productCards = await page.locator('[class*="product"], article').count();
      const addToCartBtns = await page.locator('button:has-text("Add"), button:has-text("Cart")').count();
      const viewDetailsBtns = await page.locator('button:has-text("View"), a:has-text("View")').count();
      result.products = { cards: productCards, addToCartButtons: addToCartBtns, viewDetailsButtons: viewDetailsBtns };
    }

    if (pageDef.name === 'wishlist') {
      // Test wishlist flow
      const emptyWishlist = await page.locator('text=/wishlist.*empty/i').first().isVisible().catch(() => false);
      result.wishlistEmpty = emptyWishlist;
    }

    if (pageDef.name === 'login') {
      const emailField = await page.locator('input[type="email"]').count();
      const passwordField = await page.locator('input[type="password"]').count();
      result.loginForm = { emailField, passwordField };
    }

  } catch (err) {
    result.error = err.message.substring(0, 500);
    // Screenshot on error
    try {
      const screenshotPath = path.join(OUT, `error-${pageDef.name}-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      result.screenshot = path.basename(screenshotPath);
    } catch {}
  } finally {
    await context.close();
  }

  // Trim arrays to save space
  result.consoleErrors = result.consoleErrors.slice(0, 20);
  result.consoleWarnings = result.consoleWarnings.slice(0, 10);
  result.networkErrors = result.networkErrors.slice(0, 20);
  result.brokenImages = result.brokenImages.slice(0, 20);
  result.hydrationWarnings = result.hydrationWarnings.slice(0, 10);

  return result;
}

(async () => {
  console.log('Starting live audit of', SITE);
  const browser = await chromium.launch({ headless: true });

  const allResults = [];
  for (const viewport of VIEWPORTS) {
    console.log(`\n=== Viewport: ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    for (const pageDef of PAGES) {
      process.stdout.write(`  ${pageDef.name}... `);
      const result = await auditPage(browser, viewport, pageDef);
      allResults.push(result);
      console.log(`status=${result.status} errors=${result.consoleErrors.length} netErr=${result.networkErrors.length}`);
    }
  }

  await browser.close();

  // Write JSON report
  const reportPath = path.join(OUT, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  console.log(`\nReport saved: ${reportPath}`);
  console.log(`Total pages audited: ${allResults.length}`);

  // Summary
  const summary = {
    totalPages: allResults.length,
    pagesWithErrors: allResults.filter(r => r.consoleErrors.length > 0).length,
    pagesWith500: allResults.filter(r => r.has500).length,
    pagesWith404: allResults.filter(r => r.has404).length,
    pagesWithHydration: allResults.filter(r => r.hydrationWarnings.length > 0).length,
    pagesWithBrokenImages: allResults.filter(r => r.brokenImages.length > 0).length,
    pagesWithNetworkErrors: allResults.filter(r => r.networkErrors.length > 0).length,
    pagesFailedToLoad: allResults.filter(r => r.error !== null).length,
    avgLCP: Math.round(allResults.reduce((s, r) => s + (r.lcp || 0), 0) / allResults.length),
    avgCLS: (allResults.reduce((s, r) => s + (r.cls || 0), 0) / allResults.length).toFixed(3),
    avgLoadTime: Math.round(allResults.reduce((s, r) => s + (r.loadTime || 0), 0) / allResults.length),
  };
  fs.writeFileSync(path.join(OUT, 'audit-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nSummary:', JSON.stringify(summary, null, 2));
})();
