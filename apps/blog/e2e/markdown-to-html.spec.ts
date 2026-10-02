import { expect, test } from '@playwright/test';

test('markdown to html page opens successfully', async ({ page }) => {
  await page.goto('/toolbox/markdown-to-html');

  await expect(page).toHaveURL(/\/toolbox\/markdown-to-html$/);
  await expect(page.locator('body')).toContainText('Markdown');
});
