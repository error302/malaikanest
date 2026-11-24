import { test, expect, Page } from "@playwright/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const product = { id: "1", name: "A long descriptive product name for a cotton dress", slug: "dress", price: "1500.00", stock: 4, is_active: true, status: "published", category: "1", variants: [], images: [] };
const category = { id: "1", name: "Baby clothing", slug: "baby", full_slug: "baby/clothing", product_count: 1 };
const settings = { site_name: "Malaika Nest", site_description: "Your baby shop", contact_phone: "+254700000000", contact_email: "qa@example.test", address: "Mombasa", shipping_fee: "300", free_shipping_threshold: "5000" };
async function mock(page: Page) {
  await page.route("**/api/**", async route => {
    const url = route.request().url();
    let data: unknown = {};
    if (url.includes("session")) data = { is_staff: true };
    else if (url.includes("analytics")) data = {
      payments: {
        received: "123456789.55",
        by_method: [{ method: "mpesa", amount: "123456789.55", count: 1 }],
        awaiting_payment: 1,
        to_dispatch: 0,
      },
      recent_orders: [{ id: 1, order_number: "MN-20260927-LONG", customer_name: "Example Customer", total: "1500", status: "pending", created_at: "2026-09-27" }],
      low_stock: [{ product: product.name, available: 2 }],
    };
    else if (url.includes("categories")) data = route.request().method() === "GET" ? [category] : category;
    else if (url.includes("products/1/")) data = product;
    else if (url.includes("admin/products")) data = { count: 1, results: [product] };
    else if (url.includes("admin/orders")) data = { count: 1, results: [{ id: "1", order_number: "MN-20260927-LONG", customer_name: "Example Customer", total: "1500", status: "pending", payment_status: "pending", items: [], created_at: "2026-09-27" }] };
    else if (url.includes("settings")) data = settings;
    else if (url.includes("banners")) data = [];
    await route.fulfill({ json: { data } });
  });
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function accessible(page: Page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const results = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (doc: Document, options: unknown) => Promise<{ violations: { id: string; nodes: { html: string }[] }[] }> } }).axe;
    return axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
  });
  expect(results.violations.map(v => ({ rule: v.id, elements: v.nodes.map(n => n.html) }))).toEqual([]);
}
for (const [width, height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[844,390]]) {
  test(`all manager pages reflow at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await mock(page);
    for (const view of ["dashboard", "orders", "products", "categories", "settings"]) {
      await page.goto(`/static/adminapp/#${view}`);
      await expect(page.locator("main h2")).toBeVisible();
      await noOverflow(page);
      if (width === 320 || width === 1440) await accessible(page);
    }
  });
}
test("category modal traps focus, closes with Escape and returns focus", async ({ page }) => {
  await mock(page); await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/static/adminapp/#categories");
  const opener = page.getByRole("button", { name: "+ Add Category" }); await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible(); await noOverflow(page); await accessible(page);
  for (let i=0;i<12;i++) { await page.keyboard.press("Tab"); expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true); }
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible(); await expect(opener).toBeFocused();
});

test("overview opens the new product form and requests the selected payment period", async ({ page }) => {
  await mock(page);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/static/adminapp/");
  await expect(page.getByRole("listitem").filter({ hasText: "M-Pesa" })).toBeVisible();
  const request = page.waitForRequest(request => new URL(request.url()).searchParams.get("payment_days") === "7");
  await page.getByLabel("Period").selectOption("7");
  await request;
  await page.getByRole("link", { name: "Add a product" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create draft" })).toBeEnabled();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).first().click();
  await expect(page).toHaveURL(/#products$/);
});
test("product editor fits short landscape viewport and retains typed details after failed save", async ({ page }) => {
  await mock(page); await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/static/adminapp/#products"); await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.getByLabel("Name", { exact: true }).fill("Preserve this edit");
  await page.route("**/api/products/admin/products/1/", route => route.fulfill({ status: 500, json: { detail: "Save unavailable" } }));
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save unavailable"); await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Preserve this edit"); await noOverflow(page);
});
test("saving store identity preserves unsaved banner fields", async ({ page }) => {
  await mock(page); await page.goto("/static/adminapp/#settings");
  await page.getByLabel("Hero Headline").fill("Keep this banner draft");
  await page.getByRole("button", { name: "Save Store Identity" }).click();
  await expect(page.getByRole("status")).toContainText("updated successfully");
  await expect(page.getByLabel("Hero Headline")).toHaveValue("Keep this banner draft");
});
test("network failure at startup is recoverable without pretending the session expired", async ({ page }) => {
  await page.route("**/api/**", route => route.abort()); await page.goto("/static/adminapp/");
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).not.toBeVisible();
});
test("login reflows with accessible fields and visible keyboard focus", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ status: 401, json: { detail: "Sign in required" } }));
  await page.setViewportSize({ width: 320, height: 568 }); await page.goto("/static/adminapp/");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible(); await noOverflow(page); await accessible(page);
  await page.getByRole("button", { name: "Show", exact: true }).focus();
  expect(await page.getByRole("button", { name: "Show", exact: true }).evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
});


test("failed settings load cannot submit default values", async ({ page }) => {
  await mock(page);
  await page.route("**/api/core/settings/", route => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/static/adminapp/#settings");
  await expect(page.getByRole("alert")).toContainText("Unavailable");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Store Identity" })).not.toBeVisible();
});
test("settings navigation respects unsaved-edit cancellation", async ({ page }) => {
  await mock(page); await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/static/adminapp/#settings"); await page.getByLabel("Store Name").fill("Unsaved store name");
  page.on("dialog", dialog => dialog.dismiss());
  await page.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page.getByLabel("Store Name")).toHaveValue("Unsaved store name");
  await expect(page).toHaveURL(/#settings$/);
});

test("open product editor survives orientation and zoom-sized viewport changes", async ({ page }) => {
  await mock(page); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/static/adminapp/#products"); await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Keep through rotation");
  for (const viewport of [{ width: 844, height: 390 }, { width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await noOverflow(page);
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Keep through rotation");
  }
});
test("category upload rejects oversized images before any save", async ({ page }) => {
  await mock(page); await page.goto("/static/adminapp/#categories");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(6 * 1024 * 1024) });
  await expect(page.getByRole("alert")).toContainText("no larger than 5 MB");
});

test("payments display a long transaction on mobile and switch filters", async ({ page }) => {
  await mock(page);
  await page.route("**/api/payments/admin/mpesa/**", async route => {
    const state = new URL(route.request().url()).searchParams.get("state");
    await route.fulfill({ json: { data: {
      counts: { pending: 0, confirmed: 1, failed: 0, cancelled: 0, unreconciled: 1 },
      has_next: false,
      transactions: state === "pending" ? [] : [{
        id: "payment-id", order: "MN-ORDER-123", order_status: "Paid", amount: "100",
        status: "completed", issue: "receipt_unverified", receipt: null, reported_receipt: "NLJ7RT61SV",
        checkout_id: "ws_CO_" + "1".repeat(110), destination: "3370347",
        initiated_at: "2026-11-22T10:00:00Z", confirmed_at: "2026-11-22T10:01:00Z", statement_verified_at: null,
      }],
    } } });
  });
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto("/static/adminapp/#payments");
  await expect(page.getByRole("heading", { name: "M-Pesa payments" })).toBeVisible();
  await expect(page.getByText("Match the receipt against your M-Pesa statement.")).toBeVisible();
  await page.getByText("Transaction details", { exact: true }).click();
  await noOverflow(page);
  await accessible(page);
  await page.getByRole("button", { name: "Pending 0" }).click();
  await expect(page.getByText("No pending payments found.")).toBeVisible();
});
