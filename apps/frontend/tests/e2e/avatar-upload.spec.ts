import { createHash } from 'node:crypto';

import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { MOCK_BACKEND_API_URL, mockObjectUrl } from './e2e-ports';

const AVATAR_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const AVATAR_KEY_SHAPE = /^user\/\d+-\d+\.png$/;

interface StoredUpload {
  key: string;
  size: number;
  contentType: string;
  etag: string;
  md5: string;
  bodyBase64: string;
}

interface MockState {
  uploads: StoredUpload[];
  userInfoUpdates: Array<Record<string, unknown>>;
  userInfoUpdateResponses: Array<Record<string, unknown>>;
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

async function saveAvatar(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await page.getByRole('button', { name: '编辑' }).click();
  await page
    .locator('#cms-layout-content input[type="file"]')
    .setInputFiles(file);
  await page.getByRole('button', { name: '保存' }).click();
  await expect(
    page.getByRole('button', { name: '编辑' }),
    'save must leave edit mode, which only happens after the mutation resolved',
  ).toBeVisible();
}

test.describe('Avatar upload', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${MOCK_BACKEND_API_URL}/test/reset`);
  });

  test('a picked avatar is uploaded to object storage and the save posts its bare key', async ({
    page,
    request,
  }) => {
    await login(page);
    await page.goto('/user-info');

    await saveAvatar(page, {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: AVATAR_BYTES,
    });

    await expect
      .poll(async () => (await readMockState(request)).userInfoUpdates.length, {
        timeout: 10000,
      })
      .toBe(1);

    const state = await readMockState(request);
    const posted = state.userInfoUpdates[0];

    expect(typeof posted.avatar).toBe('string');
    expect(posted.avatar).toMatch(AVATAR_KEY_SHAPE);
    expect(posted.avatar as string).not.toMatch(/^blob:/);
    expect(posted.avatar as string).not.toMatch(/^https?:/);
    expect(posted.avatar as string).not.toContain('?');

    expect(state.uploads, 'the browser must PUT the object body').toHaveLength(
      1,
    );
    const upload = state.uploads[0];

    expect(Buffer.from(upload.bodyBase64, 'base64')).toEqual(AVATAR_BYTES);
    expect(upload.size).toBe(AVATAR_BYTES.length);
    expect(upload.contentType).toBe('image/png');
    expect(upload.md5).toBe(
      createHash('md5').update(AVATAR_BYTES).digest('hex'),
    );
    expect(upload.etag).toBe(
      `"${createHash('md5').update(AVATAR_BYTES).digest('hex').toUpperCase()}"`,
    );

    expect(posted.avatar).toBe(upload.key);

    expect(state.userInfoUpdateResponses).toHaveLength(1);
    const responded = state.userInfoUpdateResponses[0];
    expect(responded.avatar).toBe(upload.key);
    expect(responded.signedAvatar).toBe(mockObjectUrl(upload.key));

    await expect(page.getByTestId('user-info-error')).toHaveCount(0);

    await expect(
      page.locator('#cms-layout-content img').first(),
    ).toHaveAttribute('src', mockObjectUrl(upload.key));
  });

  test('saving without picking a file resubmits the stored bare key without re-uploading', async ({
    page,
    request,
  }) => {
    await login(page);
    await page.goto('/user-info');

    await saveAvatar(page, {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: AVATAR_BYTES,
    });

    await expect
      .poll(async () => (await readMockState(request)).userInfoUpdates.length, {
        timeout: 10000,
      })
      .toBe(1);

    const firstPosted = (await readMockState(request)).userInfoUpdates[0];

    await page.getByRole('button', { name: '编辑' }).click();
    await page.getByRole('textbox').first().fill('ResavedAdmin');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByRole('button', { name: '编辑' })).toBeVisible();

    await expect
      .poll(async () => (await readMockState(request)).userInfoUpdates.length, {
        timeout: 10000,
      })
      .toBe(2);

    const state = await readMockState(request);
    const secondPosted = state.userInfoUpdates[1];

    expect(state.uploads).toHaveLength(1);
    expect(secondPosted.name).toBe('ResavedAdmin');
    expect(secondPosted.avatar).toBe(firstPosted.avatar);
    expect(secondPosted.avatar).toMatch(AVATAR_KEY_SHAPE);
    expect(secondPosted.avatar as string).not.toMatch(/^(?:blob:|https?:)/);
  });
});
