import { expect, test } from '@playwright/test';
import { MOCK_BACKEND_URL } from './e2e-ports';

const BACKEND = MOCK_BACKEND_URL;

test.beforeEach(async ({ request }) => {
  await request.post(`${BACKEND}/api/test/reset`);
});

test('a server-side 401 on a private fetch empties the private cache and returns the user to the login page', async ({
  page,
  request,
}) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('user-a');
  await page.getByLabel('密码').fill('secret-a');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard(\?|$)/);

  await page.getByRole('link', { name: '文章管理' }).click();
  await expect(page).toHaveURL(/\/articles(\?|$)/);
  await expect(page.getByTestId('article-row-1')).toBeVisible();
  await expect(page.getByTestId('article-row-2')).toBeVisible();
  await expect(page.getByTestId('article-row-3')).toHaveCount(0);

  const created = await request.post(`${BACKEND}/api/cms/articles/create`, {
    data: { title: 'Session B Only', excerpt: 'written out of band' },
  });
  expect(created.ok()).toBe(true);

  await page.getByRole('link', { name: '用户信息' }).click();
  await expect(page).toHaveURL(/\/user-info(\?|$)/);
  await expect(page.getByText('个人资料')).toBeVisible();

  await request.post(`${BACKEND}/api/test/reject-token`);

  await page.getByRole('button', { name: '编辑' }).click();
  await page.getByRole('button', { name: '保存' }).click();

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByLabel('用户名')).toBeVisible();
  await expect(page.getByText('个人资料')).toHaveCount(0);

  await request.post(`${BACKEND}/api/test/reject-token?value=false`);

  await page.getByLabel('用户名').fill('user-b');
  await page.getByLabel('密码').fill('secret-b');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard(\?|$)/);

  await page.getByRole('link', { name: '文章管理' }).click();
  await expect(page).toHaveURL(/\/articles(\?|$)/);
  await expect(page.getByTestId('article-row-3')).toBeVisible();
  await expect(page.getByText('Session B Only')).toBeVisible();

  await request.post(`${BACKEND}/api/test/invalidate-auth`);
  await page.getByRole('link', { name: '仪表盘' }).click();
  await expect(page).toHaveURL(/\/login(\?|$)/);

  await request.post(`${BACKEND}/api/test/invalidate-auth?value=false`);
});
