import { test, expect } from '@playwright/test';

test.describe('Life Quest Initial Shell', () => {
  test('loads mobile viewport, renders canvas and setup text box', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Life Quest/);

    // Verify Phaser canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify the FireRed-style text box and setup text are present
    const setupText = page.locator('#ui-layer');
    await expect(setupText).toContainText('Setup complete');
  });
});
