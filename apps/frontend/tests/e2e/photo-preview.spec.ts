import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { MOCK_BACKEND_API_URL, mockObjectUrl } from './e2e-ports';

const PHOTO_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const PHOTO_NAME = '回显测试照片';

interface PhotoRecord {
  name: string;
  thumbnailUrl: string;
}

interface MockState {
  photoCreates: Array<Record<string, unknown>>;
  photoCreateResponses: Array<PhotoRecord>;
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

async function uploadPhoto(page: Page, name: string) {
  await page.getByRole('button', { name: '新增' }).click();
  await page.getByLabel('名称').fill(name);
  await page.locator('[role="dialog"] input[type="file"]').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: PHOTO_BYTES,
  });
  await page.getByRole('button', { name: '确定' }).click();
}

/**
 * `PhotoCard` renders the image and the title/buttons as SIBLINGS inside
 * the same `Card` root, so scoping to the button container alone would
 * never contain the `<img>`. The nearest `div` that holds both the title
 * and the `删除` affordance is the card body; its parent is the card.
 */
async function photoCard(page: Page, name: string): Promise<Locator> {
  const title = page.getByText(name, { exact: true }).first();
  const body = page
    .locator('div')
    .filter({ has: page.getByRole('button', { name: '删除' }) })
    .filter({ has: title })
    .last();
  return body.locator('..');
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

test.describe('Photo preview and persistence', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
    await login(page);
    await page.goto('/photos');
  });

  test('a newly uploaded photo is echoed in the grid', async ({
    page,
    request,
  }) => {
    await uploadPhoto(page, PHOTO_NAME);

    await expect
      .poll(async () => (await readMockState(request)).photoCreates.length, {
        timeout: 15000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const expectedSrc = mockObjectUrl(
      state.photoCreateResponses[0].thumbnailUrl,
    );

    const card = await photoCard(page, PHOTO_NAME);
    await expect(
      card,
      'the grid must hold exactly one card for the uploaded photo',
    ).toHaveCount(1);
    await expect
      .poll(
        async () => {
          const images = card.locator('img');
          if ((await images.count()) === 0) {
            return 'no-img';
          }
          return images.first().getAttribute('src');
        },
        { timeout: 15000 },
      )
      .toBe(expectedSrc);

    await expectLoadedImage(card.locator('img').first(), expectedSrc);
  });

  test('the uploaded photo thumbnail survives a full page reload', async ({
    page,
    request,
  }) => {
    await uploadPhoto(page, PHOTO_NAME);

    await expect
      .poll(async () => (await readMockState(request)).photoCreates.length, {
        timeout: 15000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const expectedSrc = mockObjectUrl(
      state.photoCreateResponses[0].thumbnailUrl,
    );

    await page.reload();

    const card = await photoCard(page, PHOTO_NAME);
    await expect(
      card,
      'the reloaded grid must still contain exactly one card for the uploaded photo',
    ).toHaveCount(1);
    await expect
      .poll(
        async () => {
          const images = card.locator('img');
          if ((await images.count()) === 0) {
            return 'no-img';
          }
          return images.first().getAttribute('src');
        },
        { timeout: 15000 },
      )
      .toBe(expectedSrc);

    await expectLoadedImage(card.locator('img').first(), expectedSrc);
  });
});
