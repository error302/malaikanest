const { chromium, devices } = require('playwright');

const BASE_WEB = 'http://localhost:3000';
const BASE_API = 'http://localhost:8000';

const failures = [];

function logPass(msg) { console.log(`PASS | ${msg}`); }
function logFail(msg) { console.log(`FAIL | ${msg}`); failures.push(msg); }

function attachObservers(page, expected4xx = ['/api/accounts/profile/']) {
  const consoleErrors = [];
  const requestFailures = [];
  const badResponses = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  page.on('requestfailed', (req) => {
    const url = req.url();
    const errorText = req.failure()?.errorText || '';

    const isExpectedAbort = errorText.includes('ERR_ABORTED');

    if (isExpectedAbort) return;
    requestFailures.push(`${req.method()} ${url} :: ${errorText}`);
  });

  page.on('response', (res) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (expected4xx.some((p) => url.includes(p))) return;
    badResponses.push(`${status} ${url}`);
  });

  return { consoleErrors, requestFailures, badResponses };
}

async function safeStep(name, fn) {
  try {
    await fn();
    logPass(name);
  } catch (e) {
    logFail(`${name} :: ${e?.message || e}`);
  }
}

(async () => {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];

    let launched = false;
    for (const executablePath of candidates) {
      try {
        browser = await chromium.launch({ headless: true, executablePath });
        launched = true;
        break;
      } catch (_) {}
    }

    if (!launched) throw e;
  }

  const desktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await desktop.newPage();
  const obs = attachObservers(page);

  await safeStep('Homepage loads', async () => {
    await page.goto(BASE_WEB + '/', { waitUntil: 'networkidle', timeout: 30000 });
  });

  await safeStep('Navigate to categories', async () => {
    await page.click('a[href="/categories"]');
    await page.waitForURL('**/categories**', { timeout: 15000 });
  });

  await safeStep('Open product from categories', async () => {
    await page.locator('a[href^="/products/"]').first().click();
    await page.waitForURL('**/products/**', { timeout: 15000 });
  });

  await safeStep('Add to cart from product page', async () => {
    await page.getByRole('button', { name: /Add to Cart/i }).click({ timeout: 10000 });
    await page.waitForTimeout(800);
  });

  await safeStep('Open cart page', async () => {
    await page.goto(BASE_WEB + '/cart', { waitUntil: 'networkidle', timeout: 20000 });
    await page.getByText('Shopping Cart').waitFor({ timeout: 10000 });
  });

  await safeStep('Increase quantity in cart', async () => {
    await page.getByRole('button', { name: /Increase quantity/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(500);
  });

  await safeStep('Remove item from cart', async () => {
    await page.getByRole('button', { name: /Remove/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(600);
  });

  const stamp = Date.now();
  const regEmail = `pw${stamp}@example.com`;
  const regPhone = `07${String(stamp).slice(-8)}`;

  await safeStep('Register new user via UI', async () => {
    await page.goto(BASE_WEB + '/register', { waitUntil: 'networkidle', timeout: 20000 });
    await page.locator('input[name="first_name"]').fill('Play');
    await page.locator('input[name="last_name"]').fill('Tester');
    await page.locator('input[name="phone"]').fill(regPhone);
    await page.locator('input[name="email"]').fill(regEmail);
    await page.locator('input[name="password"]').fill('QaPass123!');
    await page.getByRole('button', { name: /Create account/i }).click();
    await page.waitForURL('**/verify-email**', { timeout: 15000 });
  });

  await safeStep('Login verified test user via UI', async () => {
    await page.goto(BASE_WEB + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/', { timeout: 15000 });
  });

  await safeStep('Logout via navbar button', async () => {
    await page.getByRole('button', { name: /Logout/i }).click({ timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  await safeStep('Checkout flow with login', async () => {
    await page.goto(BASE_WEB + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto(BASE_WEB + '/categories', { waitUntil: 'networkidle', timeout: 20000 });
    await page.locator('a[href^="/products/"]').first().click();
    await page.waitForURL('**/products/**', { timeout: 15000 });
    await page.getByRole('button', { name: /Add to Cart/i }).click();

    await page.goto(BASE_WEB + '/checkout', { waitUntil: 'networkidle', timeout: 20000 });
    await page.getByLabel(/M-Pesa Phone Number/i).fill('0712345678');
    await page.getByRole('button', { name: /Pay KES .* with M-Pesa/i }).click();

    const result = await Promise.race([
      page.waitForURL('**/checkout/success**', { timeout: 25000 }).then(() => 'success').catch(() => null),
      page.getByText(/Awaiting Payment Confirmation|Payment Confirmed/i).waitFor({ timeout: 25000 }).then(() => 'pending').catch(() => null),
    ]);

    if (!result) throw new Error('Did not reach checkout success/pending state');
  });

  await safeStep('Order API reachable post-checkout', async () => {
    const resp = await desktop.request.get(BASE_API + '/api/orders/orders/');
    if (resp.status() !== 200) throw new Error(`status=${resp.status()}`);
    const data = await resp.json();
    const count = Array.isArray(data?.results) ? data.results.length : 0;
    if (count < 1) throw new Error('no orders in response');
  });

  if (obs.consoleErrors.length) logFail('Desktop console errors: ' + obs.consoleErrors.slice(0, 5).join(' || '));
  else logPass('Desktop console is clean');

  if (obs.requestFailures.length) logFail('Desktop request failures: ' + obs.requestFailures.slice(0, 5).join(' || '));
  else logPass('Desktop has no failed requests');

  if (obs.badResponses.length) logFail('Desktop unexpected 4xx/5xx: ' + obs.badResponses.slice(0, 8).join(' || '));
  else logPass('Desktop has no unexpected API errors');

  await desktop.close();

  const responsiveConfigs = [
    { name: 'Tablet', options: { viewport: { width: 768, height: 1024 } }, openMenu: true },
    { name: 'Mobile', options: { ...devices['iPhone 12'] }, openMenu: true },
  ];

  for (const cfg of responsiveConfigs) {
    const ctx = await browser.newContext(cfg.options);
    const p = await ctx.newPage();
    const o = attachObservers(p);

    await safeStep(`${cfg.name} homepage loads`, async () => {
      await p.goto(BASE_WEB + '/', { waitUntil: 'networkidle', timeout: 30000 });
    });

    await safeStep(`${cfg.name} navigation to categories`, async () => {
      if (cfg.openMenu) {
        await p.getByRole('button', { name: /Open menu|Close menu/i }).click();
        await p.getByRole('link', { name: /Shop|Categories/i }).first().click();
      } else {
        await p.click('a[href="/categories"]');
      }
      await p.waitForURL('**/categories**', { timeout: 15000 });
    });

    await safeStep(`${cfg.name} product page opens`, async () => {
      await p.locator('a[href^="/products/"]').first().click();
      await p.waitForURL('**/products/**', { timeout: 15000 });
    });

    if (o.consoleErrors.length) logFail(`${cfg.name} console errors: ` + o.consoleErrors.slice(0, 3).join(' || '));
    else logPass(`${cfg.name} console is clean`);

    if (o.requestFailures.length) logFail(`${cfg.name} request failures: ` + o.requestFailures.slice(0, 3).join(' || '));
    else logPass(`${cfg.name} has no failed requests`);

    await ctx.close();
  }

  await browser.close();

  console.log(`PW_SUMMARY | failures=${failures.length}`);
  if (failures.length) process.exit(1);
})();

