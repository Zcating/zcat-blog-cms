import { expect, test } from '@playwright/test';

test.describe('Photos', () => {
  test.beforeEach(async ({ request }) => {
    await request.get('http://127.0.0.1:9090/api/test/reset');
  });

  test('list, create, and delete photos', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to photos page
    await page.goto('/photos');
    await expect(page.getByText('照片', { exact: true }).first()).toBeVisible();

    // Should show mock photo data
    await expect(
      page.getByText('风景照', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('人物照', { exact: true }).first(),
    ).toBeVisible();

    // Delete the '人物照' photo
    const deleteBtn = page
      .getByText('人物照', { exact: true })
      .first()
      .locator('..')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: '删除' });
    await deleteBtn.click();

    // Confirm deletion dialog
    await expect(page.getByText('确定删除照片 人物照 吗？')).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();

    // Verify the photo is removed
    await expect(
      page.getByText('人物照', { exact: true }).first(),
    ).not.toBeVisible();

    // Verify remaining photo still shows
    await expect(
      page.getByText('风景照', { exact: true }).first(),
    ).toBeVisible();
  });
});
