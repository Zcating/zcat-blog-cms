import { expect, test } from '@playwright/test';

test('toolbox server-rendered HTML contains the sidebar shell', async ({
  request,
}) => {
  const response = await request.get('/toolbox');
  expect(response.status()).toBe(200);

  const body = await response.text();

  expect(body).toContain('data-slot="sidebar-wrapper"');
  expect(body).not.toContain('<!--$!-->');
});
