import { expect, test, type Page } from '@playwright/test';

const OSS_HOST = 'zcating-cms-oss.s3.oss-cn-guangzhou.aliyuncs.com';

function field(source: string, name: string): string | undefined {
  return source.match(new RegExp(`(?<![\\w$])${name}:"([^"]*)"`))?.[1];
}

function photoObjects(html: string): string[] {
  return [...html.matchAll(/\{id:[^{}]*\}/g)]
    .map((match) => match[0])
    .filter((object) => object.includes('signedThumbnailUrl:'));
}

function objectKey(url: string): string {
  return decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
}

function signature(url: string): string {
  return new URL(url).searchParams.get('X-Amz-Signature') ?? '';
}

function isBareKey(value: string): boolean {
  return (
    value.length > 0 &&
    !value.startsWith('/') &&
    !/^[a-z][a-z0-9+.-]*:/i.test(value)
  );
}

function isSignedUrl(value: string): boolean {
  return /^https?:\/\//.test(value) && signature(value) !== '';
}

const BACKEND_SETTLE_MS = 20000;

async function ssr(page: Page, path: string): Promise<string> {
  const deadline = Date.now() + BACKEND_SETTLE_MS;
  let status = 0;
  do {
    const response = await page.request.get(path);
    status = response.status();
    if (status === 200) {
      return response.text();
    }
    await page.waitForTimeout(500);
  } while (Date.now() < deadline);
  expect(status, `SSR status for ${path}`).toBe(200);
  return '';
}

async function recordImageRequests(page: Page, path: string) {
  const signed: string[] = [];
  const local: string[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const { hostname } = new URL(request.url());
    if (hostname === OSS_HOST) {
      signed.push(request.url());
      await route.abort();
      return;
    }
    if (request.resourceType() === 'image') {
      local.push(request.url());
    }
    await route.continue();
  });

  const deadline = Date.now() + BACKEND_SETTLE_MS;
  do {
    await page.goto(path, { waitUntil: 'networkidle' });
    if (signed.length > 0) {
      break;
    }
    await page.waitForTimeout(500);
  } while (Date.now() < deadline);

  return { signed, local };
}

async function firstGalleryId(page: Page): Promise<string> {
  const id = (await ssr(page, '/')).match(/(?<![\w$])albumId:(\d+)/)?.[1];
  expect(
    id,
    'home payload should expose an albumId to navigate to',
  ).toBeTruthy();
  return id as string;
}

test('gallery list photos expose absolute signed original and thumbnail URLs beside bare keys', async ({
  page,
}) => {
  const photos = photoObjects(await ssr(page, '/gallery'));
  expect(
    photos.length,
    'gallery list should carry photo payloads',
  ).toBeGreaterThan(0);

  for (const photo of photos) {
    const url = field(photo, 'url') ?? '';
    const thumbnailUrl = field(photo, 'thumbnailUrl') ?? '';
    const signedUrl = field(photo, 'signedUrl') ?? '';
    const signedThumbnailUrl = field(photo, 'signedThumbnailUrl') ?? '';

    expect(isBareKey(url), `url should be a bare key, got ${url}`).toBe(true);
    expect(
      isBareKey(thumbnailUrl),
      `thumbnailUrl should be a bare key, got ${thumbnailUrl}`,
    ).toBe(true);
    expect(
      isSignedUrl(signedUrl),
      `signedUrl should be absolute and signed, got ${signedUrl}`,
    ).toBe(true);
    expect(
      isSignedUrl(signedThumbnailUrl),
      `signedThumbnailUrl should be absolute and signed, got ${signedThumbnailUrl}`,
    ).toBe(true);

    expect(
      objectKey(signedUrl),
      'signedUrl must address the object named by url',
    ).toBe(url);
    expect(
      objectKey(signedThumbnailUrl),
      'signedThumbnailUrl must address thumbnailUrl',
    ).toBe(thumbnailUrl);
  }
});

test('thumbnail signed URLs are separately signed rather than the original signature with a rewritten key', async ({
  page,
}) => {
  const photos = photoObjects(await ssr(page, '/gallery'));
  expect(photos.length).toBeGreaterThan(0);

  let separatelySigned = 0;

  for (const photo of photos) {
    const url = field(photo, 'url') ?? '';
    const thumbnailUrl = field(photo, 'thumbnailUrl') ?? '';
    const signedUrl = field(photo, 'signedUrl') ?? '';
    const signedThumbnailUrl = field(photo, 'signedThumbnailUrl') ?? '';

    if (url === thumbnailUrl) {
      expect(
        signedThumbnailUrl,
        'a photo without its own thumbnail reuses the original',
      ).toBe(signedUrl);
      continue;
    }

    separatelySigned += 1;
    expect(signedUrl).not.toBe(signedThumbnailUrl);
    expect(
      signature(signedUrl),
      'a thumbnail sharing the original signature would be SignatureDoesNotMatch at read time',
    ).not.toBe(signature(signedThumbnailUrl));
  }

  expect(
    separatelySigned,
    'at least one photo must exercise the distinct-thumbnail path',
  ).toBeGreaterThan(0);
});

test('hero and about expose the avatar as a bare key beside a separate signed avatar URL', async ({
  page,
}) => {
  for (const path of ['/', '/about']) {
    const html = await ssr(page, path);
    const avatar = field(html, 'avatar');
    const signedAvatar = field(html, 'signedAvatar');

    expect(avatar, `${path} should expose avatar`).toBeTruthy();
    expect(signedAvatar, `${path} should expose signedAvatar`).toBeTruthy();
    expect(
      isBareKey(avatar as string),
      `${path} avatar should be a bare key`,
    ).toBe(true);
    expect(
      isSignedUrl(signedAvatar as string),
      `${path} signedAvatar should be absolute and signed`,
    ).toBe(true);
    expect(objectKey(signedAvatar as string)).toBe(avatar as string);
    expect(signedAvatar).not.toBe(avatar);
  }
});

test('gallery list requests signed thumbnails and never the full-size original', async ({
  page,
}) => {
  const photos = photoObjects(await ssr(page, '/gallery'));
  const thumbnailKeys = new Set(
    photos.map((photo) => field(photo, 'thumbnailUrl')),
  );
  const originalsWithOwnThumbnail = photos
    .filter((photo) => field(photo, 'url') !== field(photo, 'thumbnailUrl'))
    .map((photo) => field(photo, 'url') ?? '');

  const { signed } = await recordImageRequests(page, '/gallery');

  await expect.poll(() => signed.length, { timeout: 15000 }).toBeGreaterThan(0);
  expect(
    signed.filter((url) => signature(url) === ''),
    'every object request must carry a signature',
  ).toEqual([]);
  expect(
    signed.map(objectKey).filter((key) => !thumbnailKeys.has(key)),
    'gallery list should only request thumbnail objects',
  ).toEqual([]);
  expect(
    signed
      .map(objectKey)
      .filter((key) => originalsWithOwnThumbnail.includes(key)),
    'gallery list must not request a full-size original that has its own thumbnail',
  ).toEqual([]);
  expect(
    originalsWithOwnThumbnail.length,
    'at least one gallery cover must have its own thumbnail for this to have teeth',
  ).toBeGreaterThan(0);
});

test('gallery detail main surface requests the signed original while the strip requests thumbnails', async ({
  page,
}) => {
  const id = await firstGalleryId(page);
  const photos = photoObjects(await ssr(page, `/gallery/${id}`));
  const originalKeys = new Set(photos.map((photo) => field(photo, 'url')));
  const thumbnailKeys = new Set(
    photos.map((photo) => field(photo, 'thumbnailUrl')),
  );

  const { signed } = await recordImageRequests(page, `/gallery/${id}`);

  await expect.poll(() => signed.length, { timeout: 15000 }).toBeGreaterThan(0);
  const requested = signed.map(objectKey);
  expect(
    requested.filter((key) => originalKeys.has(key)),
    'the main/lightbox surface should request the original object',
  ).not.toEqual([]);
  expect(
    requested.filter((key) => thumbnailKeys.has(key) && !originalKeys.has(key)),
    'the thumbnail strip should request thumbnails distinct from the original',
  ).not.toEqual([]);
});

test('about requests the signed avatar and never resolves the bare avatar key as an image', async ({
  page,
}) => {
  const avatar = field(await ssr(page, '/about'), 'avatar') ?? '';

  const { signed, local } = await recordImageRequests(page, '/about');

  await expect.poll(() => signed.length, { timeout: 15000 }).toBeGreaterThan(0);
  expect(
    signed.filter((url) => signature(url) === ''),
    'every object request must carry a signature',
  ).toEqual([]);
  expect(
    signed.map(objectKey),
    'about should request the avatar object',
  ).toContain(avatar);
  expect(
    local.filter((url) => url.endsWith(`/${avatar}`)),
    'the bare avatar key must never be used as an image src',
  ).toEqual([]);
});
