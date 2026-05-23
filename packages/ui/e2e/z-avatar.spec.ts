import { expect, test } from '@playwright/test';

test.describe('ZAvatar smoke', () => {
  test('renders the avatar smoke page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('ZAvatar E2E Test Page')).toBeVisible();
    await expect(page.locator('[data-testid="z-avatar"]')).toBeVisible();
  });

  test('renders one fallback avatar example', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-testid="z-avatar-fallback"]')).toBeVisible();
  });
});
