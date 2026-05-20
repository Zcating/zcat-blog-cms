import { expect, test } from '@playwright/test';

test('login redirects to dashboard after a successful submit', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
