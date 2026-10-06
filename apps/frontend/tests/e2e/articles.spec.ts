import { expect, test } from '@playwright/test';
import { MOCK_BACKEND_API_URL } from './e2e-ports';

/**
 * Article lane end-to-end coverage.
 *
 * The lane surfaces:
 *   - /articles      — paginated list, optimistic delete
 *   - /articles/:id  — metadata-only detail read from Query
 *
 * The mock backend (tests/e2e/mock-backend.ts) is the only
 * mocked boundary. The lane runs against the real
 * TanStack-Router + Query SSR + Nitro bundle, so failures here
 * cover the full stack — loader, route file, feature
 * component, server function, query cache.
 *
 * Cards are located by filtering the UI package's card slot on the
 * row's own text, then resolving the row's buttons inside that card.
 * The list page and the detail page are separate sibling routes, so
 * the list card is gone (not merely hidden) once the detail renders.
 */

test.describe('Articles', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
  });

  test('list, view, and delete articles', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to the articles list page
    await page.goto('/articles');
    const content = page.locator('#cms-layout-content');
    await expect(content.getByText('文章列表')).toBeVisible();

    const firstCard = content
      .locator('[data-slot="card"]')
      .filter({ hasText: 'First Article' });
    const secondCard = content
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Second Article' });
    await expect(firstCard).toHaveCount(1);
    await expect(firstCard.getByText('发布时间：2025-01-01')).toBeVisible();
    await expect(firstCard.getByText('first excerpt')).toBeVisible();
    await expect(secondCard).toHaveCount(1);
    await expect(secondCard.getByText('发布时间：2025-01-02')).toBeVisible();

    // Navigate to the detail page (metadata only)
    await firstCard.getByRole('button', { name: '详情' }).click();
    await expect(page).toHaveURL(/\/articles\/1$/);
    await expect(content.getByText('文章详情')).toBeVisible();
    await expect(content.getByText('文章标题：First Article')).toBeVisible();
    await expect(content.getByText('摘要：first excerpt')).toBeVisible();
    await expect(content.getByText('发布时间: 2025-01-01')).toBeVisible();

    // Back to the list
    await content.getByRole('button', { name: '返回' }).click();
    await expect(page).toHaveURL(/\/articles$/);
    await expect(content.getByText('文章列表')).toBeVisible();

    // Optimistic delete. `ZDialog` renders into a body-level portal,
    // so the confirmation is asserted against the page, not `content`.
    await firstCard.getByRole('button', { name: '删除' }).click();
    await expect(
      page.getByText('确定删除文章"First Article"吗？'),
    ).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();

    // The first article card is removed (optimistic + server
    // confirms), and the untouched sibling is still on the page.
    await expect(firstCard).toHaveCount(0, { timeout: 10000 });
    await expect(secondCard).toHaveCount(1);
    await expect(secondCard).toBeVisible();
  });
});
