import { expect, test } from '@playwright/test';

import { TOOL_REGISTRY } from '../app/features/toolbox/lib';

test('toolbox server-rendered HTML contains every tool card and no sidebar shell', async ({
  request,
}) => {
  const response = await request.get('/toolbox');
  expect(response.status()).toBe(200);

  const body = await response.text();

  for (const tool of TOOL_REGISTRY) {
    expect(body).toContain(tool.name);
  }
  expect(body).not.toContain('data-slot="sidebar-wrapper"');
  expect(body).not.toContain('<!--$!-->');
});
