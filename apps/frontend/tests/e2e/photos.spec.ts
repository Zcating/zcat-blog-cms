import { expect, test } from '@playwright/test';
import { MOCK_BACKEND_API_URL } from './e2e-ports';

test.describe('Photos', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
  });

  test('list, create, and delete photos', async ({ page, request }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to photos page
    await page.goto('/photos');
    await expect(page.getByText('照片', { exact: true }).first()).toBeVisible();

    // Should show mock photo data
    await expect(
      page.getByText('风景照', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('人物照', { exact: true }).first(),
    ).toBeVisible();

    // Delete the '人物照' photo
    const deleteBtn = page
      .getByText('人物照', { exact: true })
      .first()
      .locator('..')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: '删除' });
    await deleteBtn.click();

    // Confirm deletion dialog
    await expect(page.getByText('确定删除照片 人物照 吗？')).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();

    // Verify the photo is removed
    await expect(
      page.getByText('人物照', { exact: true }).first(),
    ).not.toBeVisible();

    // Verify remaining photo still shows
    await expect(
      page.getByText('风景照', { exact: true }).first(),
    ).toBeVisible();

    // The row disappearing from the grid is NOT proof the delete
    // reached the backend: the card is removed optimistically, so the
    // UI looks correct even when the request never lands. Read the
    // backend's own state and assert the photo is really gone — this
    // is the assertion that fails when the delete silently no-ops.
    await expect
      .poll(
        async () => {
          const response = await request.get(
            `${MOCK_BACKEND_API_URL}/cms/photos`,
          );
          const body = (await response.json()) as {
            code: string;
            data: { data: Array<{ id: number; name: string }> };
          };
          return body.data.data.map((photo) => photo.name);
        },
        { timeout: 10000 },
      )
      .toEqual(['风景照']);
  });
});
