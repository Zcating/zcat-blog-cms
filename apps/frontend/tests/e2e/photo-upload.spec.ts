import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { MOCK_BACKEND_API_URL, mockObjectUrl } from './e2e-ports';

const PHOTO_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const ORIGINAL_KEY_SHAPE = /^photos\/\d+-\d+\.png$/;
const THUMBNAIL_KEY_SHAPE = /^photos\/\d+-\d+\.thumbnail\.png$/;

interface StoredUpload {
  key: string;
  size: number;
  contentType: string;
  bodyBase64: string;
}

interface MockState {
  uploads: StoredUpload[];
  photoCreates: Array<Record<string, unknown>>;
  photoCreateResponses: Array<Record<string, unknown>>;
}

async function readMockState(request: APIRequestContext): Promise<MockState> {
  const response = await request.get(`${MOCK_BACKEND_API_URL}/test/state`);
  return ((await response.json()) as { data: MockState }).data;
}

test.describe('Photo upload', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
  });

  test('a picked photo uploads the original and a compressed thumbnail and posts both bare keys', async ({
    page,
    request,
  }) => {
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/photos');
    await page.getByRole('button', { name: '新增' }).click();
    await page.getByLabel('名称').fill('上传测试照片');
    await page.locator('[role="dialog"] input[type="file"]').setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: PHOTO_BYTES,
    });
    await page.getByRole('button', { name: '确定' }).click();

    await expect
      .poll(async () => (await readMockState(request)).photoCreates.length, {
        timeout: 15000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const posted = state.photoCreates[0];

    expect(typeof posted.url).toBe('string');
    expect(posted.url as string).toMatch(ORIGINAL_KEY_SHAPE);
    expect(posted.thumbnailUrl as string).toMatch(THUMBNAIL_KEY_SHAPE);
    expect(posted.url as string).not.toMatch(/^(?:blob:|https?:)/);
    expect(posted.thumbnailUrl as string).not.toMatch(/^(?:blob:|https?:)/);

    const expectedThumbnail = (posted.url as string).replace(
      /\.png$/,
      '.thumbnail.png',
    );
    expect(posted.thumbnailUrl).toBe(expectedThumbnail);

    expect(
      state.uploads,
      'the browser must PUT both object bodies',
    ).toHaveLength(2);
    const original = state.uploads.find((u) => u.key === posted.url);
    const thumbnail = state.uploads.find((u) => u.key === posted.thumbnailUrl);

    expect(original, 'original object must have been PUT').toBeDefined();
    expect(thumbnail, 'thumbnail object must have been PUT').toBeDefined();
    expect(original!.key).not.toBe(thumbnail!.key);
    expect(Buffer.from(original!.bodyBase64, 'base64')).toEqual(PHOTO_BYTES);

    const thumbnailBytes = Buffer.from(thumbnail!.bodyBase64, 'base64');
    expect(thumbnail!.contentType).toBe('image/png');
    expect(thumbnailBytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(thumbnailBytes.length).toBeGreaterThan(0);

    const responded = state.photoCreateResponses[0];
    expect(responded.url).toBe(posted.url);
    expect(responded.thumbnailUrl).toBe(posted.thumbnailUrl);
    expect(responded.signedUrl).toBe(mockObjectUrl(posted.url as string));
    expect(responded.signedThumbnailUrl).toBe(
      mockObjectUrl(posted.thumbnailUrl as string),
    );

    await expect(page.getByText('上传测试照片').first()).toBeVisible();
  });
});
