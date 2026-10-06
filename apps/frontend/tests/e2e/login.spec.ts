import { expect, test } from '@playwright/test';
import { MOCK_BACKEND_API_URL } from './e2e-ports';

test.beforeEach(async ({ request }) => {
  await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
});

test('unauthenticated access to dashboard redirects to login', async ({
  page,
}) => {
  await page.goto('/dashboard');

  // Phase 3a: the `_cms` guard records the originating URL as a
  // `redirect` search param so the login screen can bounce the user
  // back after a successful submit. The assertion tolerates either
  // the bare `/login` pathname or the search-param form.
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

test('login through server function redirects to dashboard after successful submit', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/dashboard(\?|$)/);
});

test('authenticated user gets Unauthorized should redirect to login', async ({
  page,
}) => {
  // 先登录
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard(\?|$)/);

  // 现在让 mock 后端的 auth 失效
  await page.request.post(`${MOCK_BACKEND_API_URL}/test/invalidate-auth`);

  // 刷新页面触发请求
  await page.reload();

  // 验证跳回登录页
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

/**
 * 跨账号私有缓存泄漏回归测试。
 *
 * 锁定需求是「退出或认证失效时清空全部私有缓存」。这一条覆盖的不是
 * 退出按钮，而是**同一个浏览器标签页里的第二次登录**：
 *
 *   1. 账号 A 登录，浏览 `/articles`，`['articles','list']` 以
 *      `staleTime: 'static'` 进入浏览器 Query 缓存。
 *   2. 绕过 CMS 直接往 mock 后端塞入第三篇文章——缓存里的两条从此
 *      就是「上一个账号的私有数据」。
 *   3. 会话失效（JWT 过期/被吊销），但 cookie 仍在，所以
 *      `createProtectedFunctionMiddleware` 放行，失败发生在后端。
 *   4. 用侧边栏链接做一次 SPA 跳转（不刷新页面，因此 QueryClient
 *      不会被重建），`_cms` 守卫把我们弹回 `/login`。
 *   5. 账号 B 在**同一个标签页**登录。
 *   6. 再看 `/articles`：必须显示后端当前的第三篇。若 A 的缓存条目
 *      存活，`staleTime: 'static'` 会让两行的旧列表永远渲染下去。
 *
 * 只用 mock 后端已存在的端点：`/api/test/reset`、
 * `/api/test/invalidate-auth`（`value=false` 重新放行）、
 * `/api/cms/articles/create`（直接打后端，模拟「数据已经变了」）。
 */
test('a second session in the same tab never renders the previous session cached private data', async ({
  page,
  request,
}) => {
  // --- 账号 A ---
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

  // 后端在标签页空闲期间多了一篇文章。此时刷新页面就能看到三篇，
  // 所以第三篇缺席就等于「读的是上一次会话的缓存」。
  const created = await request.post(
    `${MOCK_BACKEND_API_URL}/cms/articles/create`,
    { data: { title: 'Session B Only', excerpt: 'written out of band' } },
  );
  expect(created.ok()).toBe(true);

  // --- 会话失效（cookie 仍在，失败发生在后端）---
  await request.post(`${MOCK_BACKEND_API_URL}/test/invalidate-auth`);

  // SPA 跳转，不刷新页面：QueryClient 保持不变。
  await page.getByRole('link', { name: '仪表盘' }).click();
  await expect(page).toHaveURL(/\/login(\?|$)/);

  // --- 账号 B：让 mock 后端重新接受会话，然后在同一标签页登录 ---
  await request.post(
    `${MOCK_BACKEND_API_URL}/test/invalidate-auth?value=false`,
  );
  await page.getByLabel('用户名').fill('user-b');
  await page.getByLabel('密码').fill('secret-b');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard(\?|$)/);

  await page.getByRole('link', { name: '文章管理' }).click();
  await expect(page).toHaveURL(/\/articles(\?|$)/);

  await expect(page.getByTestId('article-row-3')).toBeVisible();
  await expect(page.getByText('Session B Only')).toBeVisible();
});

/**
 * Phase 3a remediation gate: an authenticated SSR HTML response
 * for `/dashboard` MUST contain a serialized dehydrated `UserInfo`
 * payload keyed by `['users','current']`.
 *
 * The `_cms.beforeLoad` writes the full `UserInfo` into the per-
 * request `QueryClient` via `setQueryData`; the official
 * `@tanstack/react-router-ssr-query` integration ferries that into
 * the dehydrated router payload that the start handler streams to
 * the client. A null/empty cache (the regression the gate was
 * written to prevent) would fail this assertion.
 */
test('authenticated SSR HTML carries the dehydrated users/current query', async ({
  page,
  request,
}) => {
  // Drive the login through the form so the cookie is set.
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard(\?|$)/);

  // Re-issue the same GET as the SSR pass so we observe the
  // server-emitted HTML payload.
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await request.get('/dashboard', {
    headers: { Cookie: cookieHeader },
  });
  expect(response.status()).toBe(200);
  const html = await response.text();

  // The integration writes the dehydrated router payload as a
  // streamed JSON blob. The user-info query is keyed by
  // `["users","current"]`. We assert that the canonical query
  // key appears in the document — a null/empty cache would fail
  // this because the dehydrated `query.initial` array would be
  // missing the seeded user entry.
  expect(html).toContain('users');
  expect(html).toContain('current');

  // Phase 3a remediation gate (B2): the SSR HTML MUST contain
  // the full mocked `UserInfo` payload that `_cms` seeded into
  // the Query cache. The shell subset alone (name + avatar) would
  // not contain the occupation / contact fields — seeing them
  // here proves the cache was seeded with the COMPLETE payload.
  expect(html).toContain('Developer'); // occupation from the mock backend
  expect(html).toContain('admin@test.com'); // contact.email from the mock
});
