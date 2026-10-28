import { expect, test } from '@playwright/test';

import { TOOL_REGISTRY } from '../app/features/toolbox/lib';

test('toolbox page renders stable entry cards', async ({ page }) => {
  await page.goto('/toolbox');

  const cards = page.locator('a[href^="/toolbox/"]');

  await expect(cards).toHaveCount(TOOL_REGISTRY.length);
  for (const tool of TOOL_REGISTRY) {
    await expect(cards.filter({ hasText: tool.name })).toHaveCount(1);
    await expect(page.getByText(tool.name, { exact: true })).toBeVisible();
  }
});

test('toolbox layout keeps the page itself from scrolling', async ({
  page,
}) => {
  await page.goto('/toolbox');

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);
});

test('a tool page shows a two-level breadcrumb above the page heading', async ({
  page,
}) => {
  await page.goto('/toolbox/hash');

  const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' });
  await expect(breadcrumb).toBeVisible();

  await expect(
    breadcrumb.getByRole('link', { name: '工具箱' }),
  ).toHaveAttribute('href', '/toolbox');

  const current = breadcrumb.getByText('Hash 计算', { exact: true });
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(current).not.toHaveAttribute('href', /.*/);
  await expect(current).toHaveJSProperty('tagName', 'SPAN');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const breadcrumbComesFirst = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="breadcrumb"]');
    const heading = document.querySelector('h1');
    if (!nav || !heading) return false;
    return Boolean(
      nav.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  expect(breadcrumbComesFirst).toBe(true);
});
