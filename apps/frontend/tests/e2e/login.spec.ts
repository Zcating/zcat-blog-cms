import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:9090/api/test/reset');
});

test('unauthenticated access to dashboard redirects to login', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
});

test('login redirects to dashboard after a successful submit', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test('authenticated user gets Unauthorized should redirect to login', async ({
  page,
}) => {
  // 先登录
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // 现在让 mock 后端的 auth 失效
  await page.request.post('http://127.0.0.1:9090/api/test/invalidate-auth');

  // 刷新页面触发请求
  await page.reload();

  // 验证跳回登录页
  await expect(page).toHaveURL(/\/login$/);
});
