import { createServer, type ServerResponse } from 'node:http';

const port = 9090;

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

// Default seed data
function getDefaultPhotos() {
  return [
    {
      id: 1,
      name: '风景照',
      url: 'photos/1.jpg',
      thumbnailUrl: 'photos/thumb_1.jpg',
      albumId: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: '人物照',
      url: 'photos/2.jpg',
      thumbnailUrl: 'photos/thumb_2.jpg',
      albumId: null,
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    },
  ];
}

function getDefaultAlbums() {
  return [
    {
      id: 1,
      name: '默认相册',
      description: '系统默认相册',
      available: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      cover: null,
    },
    {
      id: 2,
      name: '旅行相册',
      description: '记录旅行的美好瞬间',
      available: true,
      createdAt: '2025-02-15T00:00:00.000Z',
      updatedAt: '2025-02-15T00:00:00.000Z',
      cover: null,
    },
  ];
}

// In-memory store for E2E tests
let albums = getDefaultAlbums();
let photos = getDefaultPhotos();

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  // Test helpers (must be first to run before stateful routes)
  if (url.pathname === '/api/test/reset') {
    albums = getDefaultAlbums();
    photos = getDefaultPhotos();
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    sendJson(response, {
      accessToken: 'frontend-e2e-token',
    });
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
      presignedUrl: `http://localhost:9000/mock-bucket/${key}?presigned=mock`,
    });
    return;
  }

  if (url.pathname === '/api/cms/user-info' && request.method === 'GET') {
    sendJson(response, {
      name: 'Admin',
      contact: '{"email":"admin@test.com","github":"admin"}',
      occupation: 'Developer',
      avatar: '',
      aboutMe: 'About me',
      abstract: 'Abstract',
    });
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
      sendJson(response, {
        name: (parsed.name as string) || 'Admin',
        contact:
          typeof parsed.contact === 'string'
            ? parsed.contact
            : JSON.stringify(parsed.contact) ||
              '{"email":"admin@test.com","github":"admin"}',
        occupation: (parsed.occupation as string) || 'Developer',
        avatar: (parsed.avatar as string) || '',
        aboutMe: (parsed.aboutMe as string) || 'About me',
        abstract: (parsed.abstract as string) || 'Abstract',
      });
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
      sendJson(response, null);
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

  if (url.pathname === '/api/cms/photos/create' && request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const newPhoto = {
        id: photos.length + 1,
        name: parsed.name as string,
        url: parsed.url as string,
        thumbnailUrl: parsed.thumbnailUrl as string,
        albumId: (parsed.albumId as number | null) || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as (typeof photos)[number];
      photos.push(newPhoto);
      sendJson(response, newPhoto);
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
      sendJson(response, null);
    });
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

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock backend listening on http://127.0.0.1:${port}`);
});
