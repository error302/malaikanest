import { test, expect } from '@playwright/test';

test('basic checkout flow', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('/');

  // 2. Wait for products to load and click on a product link
  await page.waitForSelector('a[href^="/products/"]');
  const productLink = page.locator('a[href^="/products/"]').first();
  await productLink.click();

  // 3. Add to cart
  const addToCartButton = page.getByRole('button', { name: /add to cart/i });
  await expect(addToCartButton).toBeVisible();
  await addToCartButton.click();

  // 4. Go to checkout
  await page.goto('/checkout');
  
  // 5. Fill out checkout form
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="phone"]', '254700000000');
  await page.fill('input[name="address"]', '123 Test St');
  await page.fill('input[name="city"]', 'Nairobi');

  // 6. Select M-Pesa
  await page.getByText(/M-Pesa/i).click();
  
  // 7. Submit order
  const placeOrderButton = page.getByRole('button', { name: /place order/i });
  await placeOrderButton.click();

  // 8. Expect to be redirected to M-Pesa waiting screen or success screen
  await expect(page).toHaveURL(/\/checkout\/success/);
  
  // 9. Expect success message
  await expect(page.locator('text=Order Confirmed').first()).toBeVisible();
});
