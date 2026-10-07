import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { MOCK_BACKEND_API_URL, mockObjectUrl } from './e2e-ports';

const AVATAR_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const AVATAR_FILE = {
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: AVATAR_BYTES,
};

interface StoredUpload {
  key: string;
}

interface MockState {
  uploads: StoredUpload[];
}

async function readMockState(request: APIRequestContext): Promise<MockState> {
  const response = await request.get(`${MOCK_BACKEND_API_URL}/test/state`);
  return ((await response.json()) as { data: MockState }).data;
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

function content(page: Page): Locator {
  return page.locator('#cms-layout-content');
}

function fileInput(page: Page): Locator {
  return content(page).locator('input[type="file"]');
}

/** The dashed 128px drop box is the direct parent of the hidden file input. */
function uploadBox(page: Page): Locator {
  return fileInput(page).locator('..');
}

/** The read-only avatar `CmsAvatar` in `#cms-layout-content` (display mode). */
function readOnlyAvatar(page: Page): Locator {
  return content(page).locator('img');
}

/**
 * The `CmsAvatar` in the layout sidebar footer. It is fed from the
 * `cmsUser` route context prop, not the `['users','current']` query
 * cache, so it is tracked separately from `readOnlyAvatar`. Scoped via
 * the sidebar footer's own `data-sidebar` hook plus radix's
 * `data-slot="avatar-image"`, which can never match the large avatar
 * inside `#cms-layout-content`.
 */
function sidebarAvatar(page: Page): Locator {
  return page.locator('[data-sidebar="footer"] [data-slot="avatar-image"]');
}

async function enterEditMode(page: Page) {
  await page.getByRole('button', { name: '编辑' }).click();
  await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
}

async function pickAvatar(page: Page) {
  await fileInput(page).setInputFiles(AVATAR_FILE);
}

async function saveAvatar(page: Page) {
  await page.getByRole('button', { name: '保存' }).click();
  await expect(
    page.getByRole('button', { name: '编辑' }),
    'save must leave edit mode, which only happens after the mutation resolved',
  ).toBeVisible();
}

async function uploadAndSave(page: Page) {
  await enterEditMode(page);
  await pickAvatar(page);
  await saveAvatar(page);
}

async function expectLoadedImage(image: Locator, expectedSrc: string) {
  await expect(image).toHaveAttribute('src', expectedSrc);
  await expect
    .poll(
      () =>
        image.evaluate((node) => {
          const el = node as HTMLImageElement;
          return el.complete && el.naturalWidth > 0;
        }),
      { timeout: 10000 },
    )
    .toBe(true);
}

test.describe('Avatar preview and persistence', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
    await login(page);
    await page.goto('/user-info');
  });

  test('picked avatar previews immediately in the upload box', async ({
    page,
  }) => {
    await enterEditMode(page);
    await expect(uploadBox(page).locator('img')).toHaveCount(0);

    await pickAvatar(page);

    const preview = uploadBox(page).locator('img');
    await expect(
      preview,
      'choosing a file must render it inside the drop box immediately',
    ).toHaveCount(1);
    await expect(preview).toHaveAttribute('src', /^blob:/);

    await expect
      .poll(
        () =>
          preview.evaluate((node) => {
            const el = node as HTMLImageElement;
            return el.complete && el.naturalWidth > 0;
          }),
        { timeout: 10000 },
      )
      .toBe(true);
  });

  test('saved avatar is echoed back after a successful upload', async ({
    page,
    request,
  }) => {
    await uploadAndSave(page);

    await expect
      .poll(async () => (await readMockState(request)).uploads.length, {
        timeout: 10000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const expectedSrc = mockObjectUrl(state.uploads[0].key);

    await expect(
      readOnlyAvatar(page),
      'display mode must echo the uploaded object as an <img>',
    ).toHaveCount(1);
    await expectLoadedImage(readOnlyAvatar(page), expectedSrc);
  });

  test('the avatar survives a full page reload', async ({ page, request }) => {
    await uploadAndSave(page);

    await expect
      .poll(async () => (await readMockState(request)).uploads.length, {
        timeout: 10000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const expectedSrc = mockObjectUrl(state.uploads[0].key);

    await page.reload();

    await expect(
      readOnlyAvatar(page),
      'a reload re-reads GET /cms/user-info, so the stored avatar must render again',
    ).toHaveCount(1);
    await expectLoadedImage(readOnlyAvatar(page), expectedSrc);

    const sidebarAvatar = page
      .locator('nav, aside, [data-sidebar], header')
      .locator('img')
      .first();
    await expect(
      sidebarAvatar,
      'the layout sidebar avatar must show the same stored avatar after a reload',
    ).toHaveCount(1);
    await expectLoadedImage(sidebarAvatar, expectedSrc);
  });

  test('a saved avatar can be removed again', async ({ page, request }) => {
    await uploadAndSave(page);

    await expect
      .poll(async () => (await readMockState(request)).uploads.length, {
        timeout: 10000,
      })
      .toBe(1);

    await enterEditMode(page);

    const box = uploadBox(page);
    const removeControl = box
      .getByRole('button')
      .filter({ hasText: /移除|删除|清除/ });
    const labelledRemove = box.locator(
      'button[aria-label*="移除"], button[aria-label*="删除"], button[aria-label*="清除"], button[title*="移除"], button[title*="删除"], button[title*="清除"]',
    );

    await expect
      .poll(
        async () =>
          (await removeControl.count()) + (await labelledRemove.count()),
        { timeout: 5000 },
      )
      .toBeGreaterThan(0);

    const control =
      (await removeControl.count()) > 0
        ? removeControl.first()
        : labelledRemove.first();
    await control.click();

    await expect(
      box.locator('img'),
      'clearing the staged image must empty the drop box',
    ).toHaveCount(0);

    await saveAvatar(page);

    await expect(
      readOnlyAvatar(page),
      'a cleared avatar must fall back to the initial letter, not a broken <img>',
    ).toHaveCount(0);
  });

  test('the sidebar avatar updates immediately after saving, without any navigation', async ({
    page,
    request,
  }) => {
    await enterEditMode(page);
    await pickAvatar(page);

    const beforeSaveCount = await sidebarAvatar(page).count();
    const beforeSaveSrc =
      beforeSaveCount > 0
        ? await sidebarAvatar(page)
            .first()
            .getAttribute('src', { timeout: 1000 })
        : null;
    console.log(`[sidebar] src before save: ${beforeSaveSrc ?? 'no-img'}`);

    await saveAvatar(page);

    await expect
      .poll(async () => (await readMockState(request)).uploads.length, {
        timeout: 10000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const expectedSrc = mockObjectUrl(state.uploads[0].key);

    let observedSrc = 'no-img';
    await expect
      .poll(
        async () => {
          const image = sidebarAvatar(page);
          if ((await image.count()) === 0) {
            observedSrc = 'no-img';
            return observedSrc;
          }
          observedSrc = (await image.first().getAttribute('src')) ?? 'no-src';
          return observedSrc;
        },
        { timeout: 10000 },
      )
      .toBe(expectedSrc);
    console.log(`[sidebar] src after save: ${observedSrc}`);

    await expect(
      sidebarAvatar(page).first(),
      'radix keeps the <img> mounted with display:none until the image loads',
    ).toBeVisible();
    await expect
      .poll(
        () =>
          sidebarAvatar(page)
            .first()
            .evaluate((node) => {
              const el = node as HTMLImageElement;
              return el.complete && el.naturalWidth > 0;
            }),
        { timeout: 10000 },
      )
      .toBe(true);
  });
});
