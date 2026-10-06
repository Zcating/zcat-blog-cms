import { expect, test } from '@playwright/test';
import { MOCK_BACKEND_API_URL } from './e2e-ports';

test.describe('User Info', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
  });

  test('view and edit user info', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to user-info page
    await page.goto('/user-info');
    await expect(page.getByText('个人资料')).toBeVisible();

    // Verify display mode shows loader data
    const content = page.locator('#cms-layout-content');
    await expect(content.getByText('Admin', { exact: true })).toBeVisible();
    await expect(
      content.getByText('admin@test.com', { exact: true }),
    ).toBeVisible();
    await expect(content.getByText('admin', { exact: true })).toBeVisible();
    await expect(content.getByText('Developer', { exact: true })).toBeVisible();
    await expect(content.getByText('About me', { exact: true })).toBeVisible();

    // Click edit button
    await page.getByRole('button', { name: '编辑' }).click();

    // Find text inputs in the edit form - the first textbox is the name field
    const textboxes = page.getByRole('textbox');
    await expect(textboxes.first()).toBeVisible();

    // Fill the first textbox (name field) with updated value
    await textboxes.first().clear();
    await textboxes.first().fill('UpdatedAdmin');

    // Save
    await page.getByRole('button', { name: '保存' }).click();

    // Wait for display mode to show updated name
    await expect(
      content.getByText('UpdatedAdmin', { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(
      content.getByText('admin@test.com', { exact: true }),
    ).toBeVisible();

    // Click edit again, then cancel
    await page.getByRole('button', { name: '编辑' }).click();
    await page.getByRole('button', { name: '取消' }).click();

    // Verify it reverted to display mode with the updated name still showing
    await expect(
      content.getByText('UpdatedAdmin', { exact: true }),
    ).toBeVisible();
  });
});
