import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:9090/api/test/reset');
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
  await page.request.post('http://127.0.0.1:9090/api/test/invalidate-auth');

  // 刷新页面触发请求
  await page.reload();

  // 验证跳回登录页
  await expect(page).toHaveURL(/\/login(\?|$)/);
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
