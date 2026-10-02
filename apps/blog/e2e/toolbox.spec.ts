import { expect, test } from '@playwright/test';

test('toolbox page renders stable entry cards', async ({ page }) => {
  await page.goto('/toolbox');

  await expect(
    page.getByText('Markdown 转 HTML', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('JSON 查看器', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('图片和 Base64 互转', { exact: true }).first(),
  ).toBeVisible();
});
