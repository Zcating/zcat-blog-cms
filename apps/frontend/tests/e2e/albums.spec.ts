import { expect, test } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';
import { MOCK_BACKEND_API_URL } from './e2e-ports';

interface TestStateData {
  albums: Array<{ id: number; name: string; coverId: number | null }>;
  photos: Array<{ id: number; name: string; albumId: number | null }>;
}

async function readBackendState(
  request: APIRequestContext,
): Promise<TestStateData> {
  const response = await request.get(`${MOCK_BACKEND_API_URL}/test/state`);
  return ((await response.json()) as { data: TestStateData }).data;
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe('Albums', () => {
  // Reset shared mock backend state before each test
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
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

  test('created album survives in-app navigation away and back', async ({
    page,
    request,
  }) => {
    await login(page);
    await page.goto('/albums');
    await expect(page.getByText('相册列表')).toBeVisible();

    // Create a new album.
    await page.getByRole('button', { name: '新增相册' }).click();
    await page.getByLabel('相册名称').fill('跨页相册');
    await page.getByRole('button', { name: '确定' }).click();
    await expect(
      page.getByText('跨页相册', { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });

    // The backend really holds it — a row on screen proves nothing
    // on its own, because the create flow is optimistic.
    await expect
      .poll(
        async () => (await readBackendState(request)).albums.map((a) => a.name),
        {
          timeout: 10000,
        },
      )
      .toEqual(['默认相册', '旅行相册', '跨页相册']);

    // Navigate away through the sidebar and back. These are
    // client-side transitions inside the same SPA session, so the
    // album list Query slot survives — the loader prefetches it
    // with `staleTime: 'static'`, which means the remount is
    // served straight from the cache. A mutation that only wrote
    // React-local state loses the album here.
    await page.getByRole('link', { name: '照片管理' }).click();
    await expect(page).toHaveURL(/\/photos$/);
    await page.getByRole('link', { name: '相册管理' }).click();
    await expect(page).toHaveURL(/\/albums$/);

    await expect(
      page.getByText('跨页相册', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('默认相册', { exact: true }).first(),
    ).toBeVisible();
  });

  test('deleted album stays deleted after in-app navigation away and back', async ({
    page,
    request,
  }) => {
    await login(page);
    await page.goto('/albums');
    await expect(page.getByText('相册列表')).toBeVisible();

    // Delete the '旅行相册' album.
    const travelAlbumCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: '旅行相册' });
    await expect(travelAlbumCard).toHaveCount(1);
    await travelAlbumCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByText('确定删除相册 旅行相册 吗？')).toBeVisible();
    await page.getByRole('button', { name: '确定' }).click();
    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).not.toBeVisible();

    await expect
      .poll(
        async () => (await readBackendState(request)).albums.map((a) => a.name),
        {
          timeout: 10000,
        },
      )
      .toEqual(['默认相册']);

    // Same in-SPA navigation as above. The delete is optimistic, so
    // the row disappearing proves nothing; a stale cache slot would
    // resurrect the album on the way back in.
    await page.getByRole('link', { name: '照片管理' }).click();
    await expect(page).toHaveURL(/\/photos$/);
    await page.getByRole('link', { name: '相册管理' }).click();
    await expect(page).toHaveURL(/\/albums$/);

    await expect(
      page.getByText('旅行相册', { exact: true }).first(),
    ).not.toBeVisible();
    await expect(
      page.getByText('默认相册', { exact: true }).first(),
    ).toBeVisible();
  });
});
