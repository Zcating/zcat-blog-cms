import { expect, test } from '@playwright/test';

test.describe('Albums', () => {
  // Reset shared mock backend state before each test
  test.beforeEach(async ({ request }) => {
    await request.get('http://127.0.0.1:9090/api/test/reset');
  });

  test('list, create, and delete albums', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to albums page
    await page.goto('/albums');
    await expect(page.getByText('相册列表')).toBeVisible();

    // Should show mock album data
    await expect(
      page.getByText('默认相册', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).toBeVisible();

    // Create a new album
    await page.getByRole('button', { name: '新增相册' }).click();
    const nameInput = page.getByLabel('相册名称');
    await nameInput.fill('测试相册');
    await page.getByRole('button', { name: '确定' }).click();

    // Wait for the new album card to appear
    await expect(
      page.getByText('测试相册', { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Delete the '旅行相册' album
    const deleteBtn = page
      .getByText('旅行相册', { exact: true })
      .first()
      .locator('..')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: '删除' });
    await deleteBtn.click();

    // Confirm deletion dialog
    await expect(page.getByText('确定删除相册 旅行相册 吗？')).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();

    // Verify the album is removed
    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).not.toBeVisible();
  });
});
