import { expect, test } from '@playwright/test';

test.describe('User Info', () => {
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
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(page.getByText('admin@test.com')).toBeVisible();
    await expect(page.getByText('Developer')).toBeVisible();
    await expect(page.getByText('About me')).toBeVisible();

    // Click edit button
    await page.getByRole('button', { name: '编辑' }).click();

    // Verify form appears with pre-filled values
    const nameInput = page.getByDisplayValue('Admin');
    await expect(nameInput).toBeVisible();

    // Modify the name
    await nameInput.fill('UpdatedAdmin');

    // Save
    await page.getByRole('button', { name: '保存' }).click();

    // Verify display mode shows updated name
    await expect(page.getByText('UpdatedAdmin')).toBeVisible();
    await expect(page.getByText('admin@test.com')).toBeVisible();

    // Click edit again, then cancel
    await page.getByRole('button', { name: '编辑' }).click();
    await page.getByRole('button', { name: '取消' }).click();

    // Verify it reverted to display mode with the updated name still showing
    await expect(page.getByText('UpdatedAdmin')).toBeVisible();
  });
});
