import { test, expect } from '@playwright/test';

test.describe('ZAvatar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render avatar with default size', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveClass(/w-32/);
    await expect(avatar).toHaveClass(/h-32/);
  });

  test('should render avatar with small size', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar-sm"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveClass(/w-24/);
    await expect(avatar).toHaveClass(/h-24/);
  });

  test('should render avatar with large size', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar-lg"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveClass(/w-40/);
    await expect(avatar).toHaveClass(/h-40/);
  });

  test('should render avatar with explicit medium size', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar"]');
    await expect(avatar).toHaveClass(/w-32/);
    await expect(avatar).toHaveClass(/h-32/);
  });

  test('should render avatar with image and fallback', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar-with-image"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('data-slot', 'avatar');
    const fallback = avatar.locator('[data-slot="avatar-fallback"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveText('Image');
  });

  test('should render avatar fallback when no image', async ({ page }) => {
    const fallback = page.locator(
      '[data-testid="z-avatar-fallback"] [data-slot="avatar-fallback"]',
    );
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveText('fallback content');
  });

  test('should have correct avatar structure', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar"]');
    await expect(avatar).toHaveAttribute('data-slot', 'avatar');
    const fallback = page.locator(
      '[data-testid="z-avatar"] [data-slot="avatar-fallback"]',
    );
    await expect(fallback).toBeVisible();
  });

  test('should render avatar with image and show fallback when image fails', async ({
    page,
  }) => {
    const avatar = page.locator('[data-testid="z-avatar-with-image"]');
    await expect(avatar).toBeVisible();
    const fallback = avatar.locator('[data-slot="avatar-fallback"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveText('Image');
  });

  test('should be accessible', async ({ page }) => {
    const avatar = page.locator('[data-testid="z-avatar"]');
    await expect(avatar).toHaveAttribute('data-slot', 'avatar');
    const fallback = page.locator(
      '[data-testid="z-avatar"] [data-slot="avatar-fallback"]',
    );
    await expect(fallback).toBeVisible();
  });
});
