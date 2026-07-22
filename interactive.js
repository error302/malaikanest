// Interactive audit - drive real user flows on live site
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'https://malaikanest.com';
const OUT = __dirname;

async function newPage(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => errors.push(`NETFAIL ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP${r.status()} ${r.url()}`); });
  return { page, ctx, errors };
}

async function run() {
  console.log('Interactive audit start');
  const browser = await chromium.launch({ headless: true });
  const results = {};

  // MOBILE viewport for most checks
  const V = { width: 375, height: 812, mobile: true };

  // 1. Home -> click navbar (mobile hamburger)
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    // Click first product card or product link
    const productCard = page.locator('a[href*="/products/"]').first();
    const exists = await productCard.count();
    results.homeToProduct = { productLinkExists: exists > 0, errors: errors.slice(0, 5) };
    if (exists) {
      await productCard.click({ timeout: 8000 }).catch(e => results.homeToProduct.clickError = e.message.substring(0, 200));
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000);
      results.homeToProduct.afterClickUrl = page.url();
      results.homeToProduct.bodyTextLen = (await page.locator('body').innerText().catch(() => '')).trim().length;
    }
    await ctx.close();
  } catch (e) { results.homeToProduct = { error: e.message.substring(0, 300) }; }

  // 2. Add to Cart flow from best-sellers
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/best-sellers`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    // Find any "Add to Cart" or "Add" button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("Cart"), [data-testid*="add"]').first();
    const exists = await addBtn.count();
    results.addToCart = { buttonExists: exists > 0, errors: errors.slice(0, 5) };
    if (exists) {
      await addBtn.click({ timeout: 8000 }).catch(e => results.addToCart.clickError = e.message.substring(0, 200));
      await page.waitForTimeout(2000);
      // Check if toast appeared
      const toast = await page.locator('[role="alert"], [class*="toast"]').count();
      // Check cart count in navbar
      const cartCount = await page.locator('[class*="cart"], [aria-label*="cart" i]').first().textContent().catch(() => '');
      results.addToCart.toastVisible = toast > 0;
      results.addToCart.cartCount = cartCount?.trim().substring(0, 50);
    }
    await ctx.close();
  } catch (e) { results.addToCart = { error: e.message.substring(0, 300) }; }

  // 3. Cart -> Checkout flow
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/cart`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    // Find checkout/Proceed link or button
    const checkoutLink = page.locator('a:has-text("Checkout"), a:has-text("checkout"), button:has-text("Checkout")').first();
    const exists = await checkoutLink.count();
    results.cartToCheckout = { checkoutLinkExists: exists > 0, errors: errors.slice(0, 5) };
    if (exists) {
      await checkoutLink.click({ timeout: 8000 }).catch(e => results.cartToCheckout.clickError = e.message.substring(0, 200));
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      results.cartToCheckout.afterClickUrl = page.url();
    } else {
      results.cartToCheckout.bodyText = (await page.locator('body').innerText().catch(() => '')).substring(0, 300);
    }
    await ctx.close();
  } catch (e) { results.cartToCheckout = { error: e.message.substring(0, 300) }; }

  // 4. Checkout form - just fill it on empty cart
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/checkout`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    // Check form fields
    const emailInput = await page.locator('input[type="email"], input[name*="email" i]').count();
    const phoneInput = await page.locator('input[type="tel"], input[name*="phone" i]').count();
    const submitBtn = await page.locator('button[type="submit"]').count();
    const paymentRadios = await page.locator('input[type="radio"][name="payment"], input[type="radio"]').count();
    results.checkoutForm = { emailInput, phoneInput, submitBtn, paymentRadios, errors: errors.slice(0, 5) };
    // Test switching payment methods
    if (paymentRadios > 1) {
      const radios = page.locator('input[type="radio"]');
      const count = await radios.count();
      for (let i = 0; i < Math.min(count, 4); i++) {
        await radios.nth(i).check({ timeout: 3000 }).catch(() => {});
      }
      results.checkoutForm.paymentMethodSwitch = 'OK';
    }
    await ctx.close();
  } catch (e) { results.checkoutForm = { error: e.message.substring(0, 300) }; }

  // 5. Search functionality
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]').first();
    const exists = await searchInput.count();
    results.search = { inputExists: exists > 0, errors: errors.slice(0, 5) };
    if (exists) {
      // Tap to open search (mobile might need click on icon first)
      const searchIcon = page.locator('button[aria-label*="search" i], [aria-label*="search" i]').first();
      if (await searchIcon.count()) {
        await searchIcon.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(800);
      }
      await searchInput.click({ timeout: 3000 }).catch(() => {});
      await searchInput.fill('baby', { timeout: 3000 }).catch(() => {});
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
      results.search.afterSearchUrl = page.url();
      results.search.bodyTextSample = (await page.locator('body').innerText().catch(() => '')).substring(0, 300);
    }
    await ctx.close();
  } catch (e) { results.search = { error: e.message.substring(0, 300) }; }

  // 6. Wishlist - add from product page
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/best-sellers`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const prodLink = page.locator('a[href*="/products/"]').first();
    if (await prodLink.count()) {
      await prodLink.click({ timeout: 8000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);
      const heartBtn = page.locator('button[aria-label*="wishlist" i], button[aria-label*="Wishlist" i], button:has-text("wishlist" i)').first();
      const heartExists = await heartBtn.count();
      results.wishlist = { heartOnProductPage: heartExists > 0, errors: errors.slice(0, 5) };
      if (heartExists) {
        await heartBtn.click({ timeout: 5000 }).catch(e => results.wishlist.heartClickError = e.message.substring(0, 200));
        await page.waitForTimeout(1500);
        const toast = await page.locator('[role="alert"], [class*="toast"]').count();
        results.wishlist.toastAfterAdd = toast > 0;
      }
    }
    await ctx.close();
  } catch (e) { results.wishlist = { error: e.message.substring(0, 300) }; }

  // 7. Footer links (mobile)
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    const footerLinks = await page.locator('footer a, [role="contentinfo"] a').evaluateAll(els =>
      els.map(e => ({ href: e.getAttribute('href'), text: e.textContent?.trim().substring(0, 50) }))
    );
    results.footerLinks = { total: footerLinks.length, links: footerLinks.slice(0, 30), errors: errors.slice(0, 5) };
    await ctx.close();
  } catch (e) { results.footerLinks = { error: e.message.substring(0, 300) }; }

  // 8. Check empty pages - account/orders when not logged in
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/account/orders`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(5000);
    results.accountOrdersNoLogin = {
      url: page.url(),
      bodyTextLen: (await page.locator('body').innerText().catch(() => '')).trim().length,
      redirectedTo: page.url() !== `${SITE}/account/orders` ? page.url() : null,
      errors: errors.slice(0, 5),
    };
    await ctx.close();
  } catch (e) { results.accountOrdersNoLogin = { error: e.message.substring(0, 300) }; }

  // 9. Track order form validation
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/track`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    const formExists = await page.locator('form').count();
    const inputCount = await page.locator('input').count();
    const submitBtn = await page.locator('button[type="submit"]').count();
    results.trackForm = { formExists, inputCount, submitBtn, errors: errors.slice(0, 5) };
    // Try submitting empty
    if (submitBtn > 0) {
      await page.locator('button[type="submit"]').first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const errorMsg = await page.locator('text=/required/i, text=/error/i, [class*="error"]').first().textContent().catch(() => '');
      results.trackForm.errorOnEmptySubmit = errorMsg?.trim().substring(0, 200);
    }
    await ctx.close();
  } catch (e) { results.trackForm = { error: e.message.substring(0, 300) }; }

  // 10. Product detail - variant selector
  try {
    const { page, ctx, errors } = await newPage(browser, V);
    await page.goto(`${SITE}/best-sellers`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const prodLink = page.locator('a[href*="/products/"]').first();
    if (await prodLink.count()) {
      await prodLink.click({ timeout: 8000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);
      results.productDetail = {
        url: page.url(),
        errors: errors.slice(0, 5),
      };
      // Check variant selectors
      const variantBtns = await page.locator('button:has-text("size"), button:has-text("Size"), button:has-text("month"), [class*="variant"]').count();
      results.productDetail.variantButtons = variantBtns;
      // Check add to cart on product page
      const addToCartBtn = await page.locator('button:has-text("Add to Cart"), button:has-text("Add")').count();
      results.productDetail.addToCartButton = addToCartBtn;
      // Check image gallery
      const images = await page.locator('img').count();
      results.productDetail.imageCount = images;
    }
    await ctx.close();
  } catch (e) { results.productDetail = { error: e.message.substring(0, 300) }; }

  await browser.close();

  fs.writeFileSync(path.join(OUT, 'interactive-audit.json'), JSON.stringify(results, null, 2));
  console.log('Interactive audit complete');
  console.log(JSON.stringify(results, null, 2));
}

run().catch(e => { console.error('Audit failed:', e); process.exit(1); });
