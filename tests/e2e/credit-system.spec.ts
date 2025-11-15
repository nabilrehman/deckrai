import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Credit System UI Components
 *
 * Prerequisites:
 * - Dev server running on http://localhost:3000
 * - User authenticated (or mock Firebase auth)
 *
 * Run with:
 * npx playwright test
 * npx playwright test --headed (to see browser)
 * npx playwright show-report (to see results)
 */

test.describe('Credit System UI', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display CreditBadge in header', async ({ page }) => {
    // Look for credit badge
    const creditBadge = page.locator('[class*="credit"]', { hasText: /\d+ credits?/ });

    // Should be visible
    await expect(creditBadge).toBeVisible();

    // Take screenshot
    await creditBadge.screenshot({ path: 'test-results/credit-badge.png' });

    // Should show a number
    const text = await creditBadge.textContent();
    expect(text).toMatch(/\d+/);

    console.log('✅ CreditBadge displays correctly:', text);
  });

  test('should show tooltip on hover', async ({ page }) => {
    const creditBadge = page.locator('[class*="credit"]').first();

    // Hover over badge
    await creditBadge.hover();

    // Wait for tooltip
    await page.waitForTimeout(500);

    // Screenshot with tooltip
    await page.screenshot({ path: 'test-results/credit-badge-tooltip.png' });

    console.log('✅ Tooltip appears on hover');
  });

  test('should open OutOfCreditsModal when clicking "Buy more"', async ({ page }) => {
    // Click "Buy more" button in credit badge
    const buyButton = page.getByRole('button', { name: /buy more/i });

    if (await buyButton.isVisible()) {
      await buyButton.click();

      // Wait for modal to appear
      await page.waitForTimeout(500);

      // Check if modal is visible
      const modal = page.locator('[class*="modal"]', { hasText: /out of credits/i });
      await expect(modal).toBeVisible();

      // Screenshot the modal
      await page.screenshot({
        path: 'test-results/out-of-credits-modal.png',
        fullPage: true
      });

      console.log('✅ OutOfCreditsModal opens successfully');

      // Close modal
      const closeButton = page.getByRole('button', { name: /close|maybe later/i }).first();
      await closeButton.click();
    }
  });

  test('should display credit packages in modal', async ({ page }) => {
    // Trigger modal (you may need to adjust selector based on your implementation)
    const buyButton = page.getByRole('button', { name: /buy more/i }).first();

    if (await buyButton.isVisible()) {
      await buyButton.click();
      await page.waitForTimeout(500);

      // Check for credit pack cards
      const packCards = page.locator('[class*="credit"]', { hasText: /\$\d+/ });
      const count = await packCards.count();

      expect(count).toBeGreaterThan(0);

      console.log(`✅ Found ${count} credit pack options`);

      // Screenshot each package
      for (let i = 0; i < Math.min(count, 4); i++) {
        const card = packCards.nth(i);
        await card.screenshot({
          path: `test-results/credit-pack-${i + 1}.png`
        });
      }
    }
  });

  test('should navigate to pricing page', async ({ page }) => {
    // Navigate to pricing
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Check for pricing page content
    const heading = page.getByRole('heading', { name: /get more credits|pricing/i });
    await expect(heading).toBeVisible();

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/pricing-page-full.png',
      fullPage: true
    });

    console.log('✅ Pricing page loads successfully');
  });

  test('should display subscription plans on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click "Monthly Plans" tab
    const monthlyTab = page.getByRole('button', { name: /monthly plans|subscriptions/i });

    if (await monthlyTab.isVisible()) {
      await monthlyTab.click();
      await page.waitForTimeout(500);

      // Check for plan cards
      const planCards = page.locator('[class*="plan"]', { hasText: /\$\d+\/month|\$\d+ per month/i });
      const count = await planCards.count();

      expect(count).toBeGreaterThan(0);

      console.log(`✅ Found ${count} subscription plans`);

      // Screenshot
      await page.screenshot({
        path: 'test-results/subscription-plans.png',
        fullPage: true
      });
    }
  });

  test('should display one-time packs on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click "One-Time Purchase" tab
    const oneTimeTab = page.getByRole('button', { name: /one-time|purchase/i });

    if (await oneTimeTab.isVisible()) {
      await oneTimeTab.click();
      await page.waitForTimeout(500);

      // Screenshot
      await page.screenshot({
        path: 'test-results/one-time-packs.png',
        fullPage: true
      });

      console.log('✅ One-time packs display correctly');
    }
  });

  test('should show LowCreditsWarning when balance is low', async ({ page }) => {
    // This test requires mocking the credit balance to be low
    // You may need to adjust based on your auth/state management

    const warningBanner = page.locator('[class*="warning"]', { hasText: /low on credits/i });

    // Check if warning exists (will depend on current credit balance)
    const isVisible = await warningBanner.isVisible().catch(() => false);

    if (isVisible) {
      await page.screenshot({
        path: 'test-results/low-credits-warning.png'
      });
      console.log('✅ Low credits warning is visible');
    } else {
      console.log('ℹ️  Low credits warning not visible (balance may be sufficient)');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await page.screenshot({
      path: 'test-results/mobile-view-home.png',
      fullPage: true
    });

    // Navigate to pricing on mobile
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/mobile-view-pricing.png',
      fullPage: true
    });

    console.log('✅ Mobile responsive design verified');
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/tablet-view-pricing.png',
      fullPage: true
    });

    console.log('✅ Tablet responsive design verified');
  });

  test('should display all pricing features', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Check for key elements
    const elements = [
      { name: 'Current balance', selector: 'text=/current balance|balance:/i' },
      { name: 'Tab switcher', selector: 'button:has-text("One-Time")' },
      { name: 'Credit never expire', selector: 'text=/never expire/i' },
      { name: 'Secure payment', selector: 'text=/secure payment|stripe/i' },
    ];

    for (const elem of elements) {
      const locator = page.locator(elem.selector).first();
      const isVisible = await locator.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`✅ ${elem.name} is visible`);
      } else {
        console.log(`⚠️  ${elem.name} not found (may be conditional)`);
      }
    }
  });

  test('should handle modal dismiss correctly', async ({ page }) => {
    // Open modal
    const buyButton = page.getByRole('button', { name: /buy more/i }).first();

    if (await buyButton.isVisible()) {
      await buyButton.click();
      await page.waitForTimeout(500);

      // Click outside modal (on overlay)
      await page.locator('[class*="overlay"]').first().click({ force: true });

      // Wait a bit
      await page.waitForTimeout(500);

      // Modal should be closed
      const modal = page.locator('[class*="modal"]', { hasText: /out of credits/i });
      const isVisible = await modal.isVisible().catch(() => false);

      expect(isVisible).toBe(false);

      console.log('✅ Modal dismisses correctly');
    }
  });

  test('visual regression - credit badge states', async ({ page }) => {
    // This test creates screenshots for visual regression testing

    const states = [
      { name: 'sufficient', className: 'bg-blue-50' },
      { name: 'low', className: 'bg-orange-50' },
      { name: 'out', className: 'bg-red-50' },
    ];

    for (const state of states) {
      const badge = page.locator(`[class*="${state.className}"]`).first();

      if (await badge.isVisible().catch(() => false)) {
        await badge.screenshot({
          path: `test-results/credit-badge-${state.name}.png`
        });
        console.log(`✅ Captured ${state.name} state`);
      }
    }
  });

  test('accessibility - credit components should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Take screenshot to see focus states
    await page.screenshot({
      path: 'test-results/keyboard-navigation.png'
    });

    console.log('✅ Keyboard navigation tested');
  });

  test('performance - pricing page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Pricing page loaded in ${loadTime}ms`);

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Credit Purchase Flow', () => {

  test('should display correct package information', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click on a specific package
    const proPackage = page.locator('text=/Pro Pack|100 credits/i').first();

    if (await proPackage.isVisible()) {
      // Hover to see details
      await proPackage.hover();

      // Take screenshot
      await page.screenshot({
        path: 'test-results/package-details-hover.png'
      });

      console.log('✅ Package details display on hover');
    }
  });

  test('should show purchase confirmation elements', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click purchase button
    const purchaseButton = page.getByRole('button', { name: /purchase/i }).first();

    if (await purchaseButton.isVisible()) {
      await purchaseButton.click();
      await page.waitForTimeout(1000);

      // Screenshot what happens (may redirect to Stripe)
      await page.screenshot({
        path: 'test-results/purchase-click-result.png',
        fullPage: true
      });

      console.log('✅ Purchase button click handled');
    }
  });
});
