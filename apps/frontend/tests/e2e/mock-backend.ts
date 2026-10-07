import { createHash } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';

import {
  MOCK_BACKEND_PORT as port,
  MOCK_BUCKET_PATH,
  mockObjectUrl,
} from './e2e-ports';

function sendJson(response: ServerResponse, data: unknown, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      code: '0000',
      message: 'success',
      data,
    }),
  );
}

/**
 * A VOID success: the backend's `ResultData<T>` types `data?: T`, so
 * `createResult` writes `data: params.data` and `JSON.stringify` drops
 * the key when there is no payload. Sending `data: null` here instead
 * is shape-wrong — the key is present, so a client that wrongly requires
 * it still passes and every e2e around a void endpoint is a false green.
 * Use this for every genuinely payload-less success.
 */
function sendVoid(response: ServerResponse, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      code: '0000',
      message: 'success',
    }),
  );
}

/**
 * Mirrors the backend's error envelopes: the auth middleware's literal
 * `c.json({ code, message }, 401)` and `createResult`, which always writes
 * `data: params.data` and therefore omits the key entirely when the value
 * is `undefined`.
 */
function sendError(
  response: ServerResponse,
  code: string,
  message: string,
  data?: unknown,
  status = 401,
) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ code, message, data }));
}

const SEED_OBJECT = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const SEED_OBJECT_KEYS = [
  'photos/1.jpg',
  'photos/thumb_1.jpg',
  'photos/2.jpg',
  'photos/thumb_2.jpg',
];

interface StoredObject {
  bytes: Buffer;
  contentType: string;
}

interface StoredUpload {
  key: string;
  size: number;
  contentType: string;
  etag: string;
  md5: string;
  bodyBase64: string;
}

let objects = new Map<string, StoredObject>();
let uploads: StoredUpload[] = [];
let photoCreates: Array<Record<string, unknown>> = [];
let photoCreateResponses: Array<Record<string, unknown>> = [];
let userInfoUpdates: Array<Record<string, unknown>> = [];
let userInfoUpdateResponses: Array<Record<string, unknown>> = [];

function seedObjects() {
  objects = new Map(
    SEED_OBJECT_KEYS.map((key) => [
      key,
      { bytes: SEED_OBJECT, contentType: 'image/png' },
    ]),
  );
}

function corsHeaders(request: { headers: Record<string, unknown> }) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers':
      (request.headers['access-control-request-headers'] as string) ?? '*',
    'Access-Control-Max-Age': '600',
  };
}

// Default seed data
function getDefaultPhotos() {
  return [
    {
      id: 1,
      name: '风景照',
      url: 'photos/1.jpg',
      thumbnailUrl: 'photos/thumb_1.jpg',
      signedUrl: mockObjectUrl('photos/1.jpg'),
      signedThumbnailUrl: mockObjectUrl('photos/thumb_1.jpg'),
      albumId: null as number | null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: '人物照',
      url: 'photos/2.jpg',
      thumbnailUrl: 'photos/thumb_2.jpg',
      signedUrl: mockObjectUrl('photos/2.jpg'),
      signedThumbnailUrl: mockObjectUrl('photos/thumb_2.jpg'),
      albumId: null as number | null,
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    },
  ];
}

function getDefaultUserInfo() {
  return {
    name: 'Admin',
    contact: '{"email":"admin@test.com","github":"admin"}',
    occupation: 'Developer',
    avatar: '',
    signedAvatar: '',
    aboutMe: 'About me',
    abstract: 'Abstract',
  };
}

function getDefaultAlbums() {
  return [
    {
      id: 1,
      name: '默认相册',
      description: '系统默认相册',
      available: true,
      coverId: null as number | null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      cover: null,
    },
    {
      id: 2,
      name: '旅行相册',
      description: '记录旅行的美好瞬间',
      available: true,
      coverId: null as number | null,
      createdAt: '2025-02-15T00:00:00.000Z',
      updatedAt: '2025-02-15T00:00:00.000Z',
      cover: null,
    },
  ];
}

// In-memory store for E2E tests
let currentUserInfo = getDefaultUserInfo();
let albums = getDefaultAlbums();
let photos = getDefaultPhotos();
let authInvalid = false;
let tokenRejected = false;
let articleTags: Array<{
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 10,
    name: 'tech',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 11,
    name: 'life',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
];
let nextTagId = 12;
let articles: Array<{
  id: number;
  title: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  createByUserId: number;
  publishAt: string;
}> = [
  {
    id: 1,
    title: 'First Article',
    excerpt: 'first excerpt',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createByUserId: 1,
    publishAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'Second Article',
    excerpt: 'second excerpt',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    createByUserId: 1,
    publishAt: '2025-01-02T00:00:00.000Z',
  },
];
let nextArticleId = 3;

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  // Test helpers (must be first to run before stateful routes)
  if (url.pathname === '/api/test/reset') {
    albums = getDefaultAlbums();
    photos = getDefaultPhotos();
    articleTags = [
      {
        id: 10,
        name: 'tech',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 11,
        name: 'life',
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
    ];
    nextTagId = 12;
    articles = [
      {
        id: 1,
        title: 'First Article',
        excerpt: 'first excerpt',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        createByUserId: 1,
        publishAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        title: 'Second Article',
        excerpt: 'second excerpt',
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
        createByUserId: 1,
        publishAt: '2025-01-02T00:00:00.000Z',
      },
    ];
    nextArticleId = 3;
    authInvalid = false;
    tokenRejected = false;
    uploads = [];
    photoCreates = [];
    photoCreateResponses = [];
    userInfoUpdates = [];
    userInfoUpdateResponses = [];
    currentUserInfo = getDefaultUserInfo();
    seedObjects();
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/test/state' && request.method === 'GET') {
    sendJson(response, {
      albums,
      photos,
      uploads,
      photoCreates,
      photoCreateResponses,
      userInfoUpdates,
      userInfoUpdateResponses,
    });
    return;
  }

  if (url.pathname === '/api/test/invalidate-auth') {
    authInvalid = url.searchParams.get('value') !== 'false';
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/test/reject-token') {
    tokenRejected = url.searchParams.get('value') !== 'false';
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname.startsWith(MOCK_BUCKET_PATH)) {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders(request));
      response.end();
      return;
    }

    if (request.method === 'GET') {
      const key = decodeURIComponent(
        url.pathname.slice(MOCK_BUCKET_PATH.length),
      );
      const object = objects.get(key);
      if (!object) {
        response.writeHead(404, corsHeaders(request));
        response.end();
        return;
      }
      response.writeHead(200, {
        ...corsHeaders(request),
        'Content-Type': object.contentType,
        'Content-Length': String(object.bytes.length),
      });
      response.end(object.bytes);
      return;
    }

    if (request.method === 'PUT') {
      const key = decodeURIComponent(
        url.pathname.slice(MOCK_BUCKET_PATH.length),
      );
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        const body = Buffer.concat(chunks);
        const md5 = createHash('md5').update(body).digest('hex');
        uploads.push({
          key,
          size: body.length,
          contentType: request.headers['content-type'] ?? '',
          etag: `"${md5.toUpperCase()}"`,
          md5,
          bodyBase64: body.toString('base64'),
        });
        objects.set(key, {
          bytes: body,
          contentType: request.headers['content-type'] ?? '',
        });
        response.writeHead(200, {
          ...corsHeaders(request),
          ETag: `"${md5.toUpperCase()}"`,
        });
        response.end();
      });
      return;
    }
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    sendJson(response, {
      accessToken: 'frontend-e2e-token',
    });
    return;
  }

  if (url.pathname === '/api/auth/is-valid' && request.method === 'POST') {
    if (authInvalid) {
      sendError(response, 'ERR0002', 'Unauthorized');
      return;
    }
    sendJson(response, {
      valid: request.headers.authorization === 'Bearer frontend-e2e-token',
    });
    return;
  }

  if (tokenRejected && url.pathname.startsWith('/api/cms/')) {
    sendError(response, 'ERR0002', 'Unauthorized');
    return;
  }

  if (url.pathname === '/api/cms/statistics/summary') {
    sendJson(response, {
      totalVisits: 1,
      totalUniqueVisitors: 1,
      todayVisits: 1,
      todayUniqueVisitors: 1,
      topPages: [],
    });
    return;
  }

  if (url.pathname === '/api/cms/statistics/chart-data') {
    sendJson(response, []);
    return;
  }

  if (url.pathname === '/api/cms/statistics/detail') {
    sendJson(response, []);
    return;
  }

  if (url.pathname === '/api/cms/system-setting/upload-config') {
    const key = url.searchParams.get('key') || 'default-key';
    sendJson(response, {
      presignedUrl: mockObjectUrl(key),
    });
    return;
  }

  if (url.pathname === '/api/cms/user-info' && request.method === 'GET') {
    sendJson(response, { ...currentUserInfo });
    return;
  }

  if (
    url.pathname === '/api/cms/user-info/update' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      userInfoUpdates.push(parsed);
      const avatar = (parsed.avatar as string) || '';
      const userInfo = {
        name: (parsed.name as string) || 'Admin',
        contact:
          typeof parsed.contact === 'string'
            ? parsed.contact
            : JSON.stringify(parsed.contact) ||
              '{"email":"admin@test.com","github":"admin"}',
        occupation: (parsed.occupation as string) || 'Developer',
        avatar,
        signedAvatar:
          avatar && !avatar.startsWith('blob:') ? mockObjectUrl(avatar) : '',
        aboutMe: (parsed.aboutMe as string) || 'About me',
        abstract: (parsed.abstract as string) || 'Abstract',
      };
      userInfoUpdateResponses.push(userInfo);
      currentUserInfo = userInfo;
      sendJson(response, userInfo);
    });
    return;
  }

  // --- Album routes ---

  if (url.pathname === '/api/cms/photo-albums' && request.method === 'GET') {
    sendJson(response, {
      data: albums,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      total: albums.length,
    });
    return;
  }

  if (url.pathname === '/api/cms/photo-albums' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const newAlbum = {
        id: albums.length + 1,
        name: parsed.name as string,
        description: (parsed.description as string) || '',
        available: (parsed.available as boolean) || false,
        coverId: null as number | null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cover: null,
      };
      albums.push(newAlbum);
      sendJson(response, newAlbum);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photo-albums/update' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: number } & Record<
        string,
        unknown
      >;
      const album = albums.find((a) => a.id === parsed.id);
      if (album) {
        Object.assign(album, parsed);
      }
      sendJson(response, album || null);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photo-albums/delete' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: string };
      const idx = albums.findIndex((a) => a.id === Number(parsed.id));
      if (idx !== -1) albums.splice(idx, 1);
      sendVoid(response);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photo-albums/cover' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { albumId: number; photoId: number };
      const album = albums.find((a) => a.id === parsed.albumId);
      if (album) {
        album.coverId = parsed.photoId;
      }
      sendVoid(response);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photo-albums/add-photos' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as {
        albumId: number;
        photoIds: number[];
      };
      for (const photoId of parsed.photoIds) {
        const photo = photos.find((p) => p.id === photoId);
        if (photo) {
          photo.albumId = parsed.albumId;
        }
      }
      sendVoid(response);
    });
    return;
  }

  if (
    url.pathname.startsWith('/api/cms/photo-albums/') &&
    request.method === 'GET'
  ) {
    const id = Number(url.pathname.split('/').pop());
    const album = albums.find((a) => a.id === id) || null;
    sendJson(response, album);
    return;
  }

  // --- Photo routes ---

  if (url.pathname === '/api/cms/photos' && request.method === 'GET') {
    sendJson(response, {
      data: photos,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: photos.length,
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photos/empty-album' &&
    request.method === 'GET'
  ) {
    sendJson(
      response,
      photos.filter((p) => p.albumId === null),
    );
    return;
  }

  if (url.pathname === '/api/cms/photos/create' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const url = parsed.url as string;
      const thumbnailUrl = parsed.thumbnailUrl as string;
      const newPhoto = {
        id: photos.length + 1,
        name: parsed.name as string,
        url,
        thumbnailUrl,
        signedUrl: mockObjectUrl(url),
        signedThumbnailUrl: mockObjectUrl(thumbnailUrl),
        albumId: (parsed.albumId as number | null) || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as (typeof photos)[number];
      photoCreates.push(parsed);
      photoCreateResponses.push(newPhoto);
      photos.push(newPhoto);
      sendJson(response, newPhoto);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/photos/create/with-album' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const url = parsed.url as string;
      const thumbnailUrl = parsed.thumbnailUrl as string;
      const newPhoto = {
        id: photos.length + 1,
        name: parsed.name as string,
        url,
        thumbnailUrl,
        signedUrl: mockObjectUrl(url),
        signedThumbnailUrl: mockObjectUrl(thumbnailUrl),
        albumId: (parsed.albumId as number | null) || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as (typeof photos)[number];
      photos.push(newPhoto);
      sendJson(response, newPhoto);
    });
    return;
  }

  if (url.pathname === '/api/cms/photos/update' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: number } & Record<
        string,
        unknown
      >;
      const photo = photos.find((p) => p.id === parsed.id);
      if (photo) {
        Object.assign(photo, parsed, { updatedAt: new Date().toISOString() });
        photo.signedUrl = mockObjectUrl(photo.url);
        photo.signedThumbnailUrl = mockObjectUrl(photo.thumbnailUrl);
      }
      sendJson(response, photo ?? null);
    });
    return;
  }

  if (url.pathname === '/api/cms/photos/delete' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: number };
      const idx = photos.findIndex((p) => p.id === parsed.id);
      if (idx !== -1) photos.splice(idx, 1);
      sendVoid(response);
    });
    return;
  }

  // --- Article routes ---

  if (url.pathname === '/api/cms/articles' && request.method === 'GET') {
    sendJson(response, {
      data: articles,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      total: articles.length,
    });
    return;
  }

  if (url.pathname === '/api/cms/articles/detail' && request.method === 'GET') {
    const id = Number(url.searchParams.get('id'));
    const article = articles.find((a) => a.id === id);
    if (!article) {
      sendJson(response, null);
      return;
    }
    sendJson(response, article);
    return;
  }

  if (
    url.pathname === '/api/cms/articles/create' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const newArticle = {
        id: nextArticleId++,
        title: (parsed.title as string) ?? 'Untitled',
        excerpt: (parsed.excerpt as string) ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createByUserId: 1,
        publishAt:
          (parsed.publishAt as string | undefined) ?? new Date().toISOString(),
      };
      articles.push(newArticle);
      sendJson(response, newArticle);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/articles/update' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: number } & Record<
        string,
        unknown
      >;
      const article = articles.find((a) => a.id === parsed.id);
      if (article) {
        Object.assign(article, parsed, { updatedAt: new Date().toISOString() });
      }
      sendJson(response, article ?? null);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/articles/delete' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { id: number };
      const idx = articles.findIndex((a) => a.id === parsed.id);
      if (idx !== -1) articles.splice(idx, 1);
      sendVoid(response);
    });
    return;
  }

  if (
    url.pathname === '/api/cms/articles/upload-images' &&
    request.method === 'POST'
  ) {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { images: string[] };
      const urls = (parsed.images ?? []).map((k) => `/cdn/${k}`);
      sendJson(response, urls);
    });
    return;
  }

  // --- Article-tag routes ---

  if (url.pathname === '/api/cms/article-tags' && request.method === 'GET') {
    sendJson(response, articleTags);
    return;
  }

  if (url.pathname === '/api/cms/article-tags' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { name: string };
      const newTag = {
        id: nextTagId++,
        name: parsed.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      articleTags.push(newTag);
      sendJson(response, newTag);
    });
    return;
  }

  if (
    url.pathname.startsWith('/api/cms/article-tags/') &&
    request.method === 'GET'
  ) {
    const id = Number(url.pathname.split('/').pop());
    const tag = articleTags.find((t) => t.id === id) ?? null;
    sendJson(response, tag);
    return;
  }

  if (
    url.pathname.startsWith('/api/cms/article-tags/') &&
    request.method === 'PUT'
  ) {
    const id = Number(url.pathname.split('/').pop());
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as { name?: string };
      const tag = articleTags.find((t) => t.id === id);
      if (tag && parsed.name !== undefined) {
        tag.name = parsed.name;
        tag.updatedAt = new Date().toISOString();
      }
      sendJson(response, tag ?? null);
    });
    return;
  }

  if (
    url.pathname.startsWith('/api/cms/article-tags/') &&
    request.method === 'DELETE'
  ) {
    const id = Number(url.pathname.split('/').pop());
    const idx = articleTags.findIndex((t) => t.id === id);
    if (idx !== -1) articleTags.splice(idx, 1);
    sendVoid(response);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      code: '4040',
      message: `Unhandled mock backend route: ${request.method} ${url.pathname}`,
      data: null,
    }),
  );
});

seedObjects();

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock backend listening on http://127.0.0.1:${port}`);
});
