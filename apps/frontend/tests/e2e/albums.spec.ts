import { expect, test } from '@playwright/test';

test.describe('Albums', () => {
  // Reset shared mock backend state before each test
  test.beforeEach(async ({ request }) => {
    await request.post('http://127.0.0.1:9090/api/test/reset');
  });

  test('list, create, and delete albums', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to albums page
    await page.goto('/albums');
    await expect(page.getByText('相册列表')).toBeVisible();

    // Should show mock album data
    await expect(
      page.getByText('默认相册', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).toBeVisible();

    // Create a new album
    await page.getByRole('button', { name: '新增相册' }).click();
    const nameInput = page.getByLabel('相册名称');
    await nameInput.fill('测试相册');
    await page.getByRole('button', { name: '确定' }).click();

    // Wait for the new album card to appear
    await expect(
      page.getByText('测试相册', { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Delete the '旅行相册' album. The card is located by filtering
    // on the album's own text, then resolving the button inside that
    // card. A fixed-depth `..` parent chain is not usable here: the
    // optimistic insert above reorders the grid and remounts the
    // newly created card, so the chain's target element shifts.
    const travelAlbumCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: '旅行相册' });
    await expect(travelAlbumCard).toHaveCount(1);
    await travelAlbumCard.getByRole('button', { name: '删除' }).click();

    // Confirm deletion dialog
    await expect(page.getByText('确定删除相册 旅行相册 吗？')).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();

    // Verify the album is removed
    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).not.toBeVisible();
  });

  test('navigate to detail page and confirm parallel reads', async ({
    page,
  }) => {
    // Login + navigate to /albums
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/albums');
    await expect(page.getByText('相册列表')).toBeVisible();

    // Navigate into the first album detail page via the
    // "查看详情" affordance. The card is located by filtering on the
    // album's own text, then resolving the button inside that card, so
    // the click cannot land on a sibling album. The TanStack route is
    // mounted at `/albums/:albumId`, so the URL pathname must end in
    // `/albums/<numeric id>`.
    const albumCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: '默认相册' });
    await expect(albumCard).toHaveCount(1);
    await albumCard.getByRole('button', { name: '查看详情' }).click();

    await expect(page).toHaveURL(/\/albums\/\d+$/);

    // Detail page header reads from the album-detail Query
    // slot, which the loader prefetched via
    // `photoAlbumDetailQueryOptions`.
    await expect(page.getByText('相册名称：默认相册')).toBeVisible();
    await expect(page.getByText('相册描述：系统默认相册')).toBeVisible();

    // The photo grid + pagination footer come from the photo
    // list Query slot. The album list page paginates at 10 per
    // page and this slot at 20, so the select text proves the
    // photo slot (not the album slot) is what rendered.
    await expect(page.getByText('每页 20 条')).toBeVisible();
    await expect(page.getByText('风景照', { exact: true })).toBeVisible();
    await expect(page.getByText('人物照', { exact: true })).toBeVisible();

    // The "选择照片" affordance reads from the empty-album
    // photos Query slot — its selector opens only after the
    // loader has hydrated that slot, so the button is the
    // contract we can assert against.
    await expect(page.getByRole('button', { name: '选择照片' })).toBeVisible();
  });
});
