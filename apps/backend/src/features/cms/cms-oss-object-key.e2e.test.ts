import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => {
  const client = {
    photoAlbum: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    photo: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userInfo: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation(
    async (run: (tx: unknown) => Promise<unknown>) => run(client),
  );
  return client;
});

const mockOss = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  deleteFile: vi.fn(),
  presignUploadUrl: vi.fn(),
  presignDownloadUrl: vi.fn(),
}));

vi.mock('../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../common/oss.service', () => ({
  ossService: mockOss,
}));

vi.mock('../../common/statistic-service', () => ({
  recordVisitor: vi.fn(),
}));

vi.mock('../../middleware/auth', () => ({
  authMiddleware: vi.fn((c: any, next: () => Promise<void>) => {
    c.set('user', { userId: 1, username: 'admin' });
    return next();
  }),
}));

import { app } from '../../app';

const PRESIGNED_URL =
  'https://signed.oss.invalid/user/avatar.jpg?X-Amz-Signature=deadbeef&X-Amz-Expires=60';

const photoRow = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  name: 'Sunset',
  url: 'photos/sunset.jpg',
  thumbnailUrl: 'photos/sunset.thumbnail.jpg',
  albumId: 3,
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  updatedAt: new Date('2026-01-02T03:04:05.000Z'),
  ...overrides,
});

const userInfoRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Admin',
  contact: '{"email":"admin@test.com","github":"admin"}',
  occupation: 'Developer',
  avatar: 'user/avatar.jpg',
  aboutMe: 'About me',
  abstract: 'Abstract',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  updatedAt: new Date('2026-01-02T03:04:05.000Z'),
  userId: 1,
  ...overrides,
});

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const put = (path: string, body: unknown) =>
  app.request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const userInfoBody = (avatar: string) => ({
  name: 'Admin',
  contact: { email: 'admin@test.com', github: 'admin' },
  occupation: 'Developer',
  avatar,
  aboutMe: 'About me',
  abstract: 'Abstract',
});

const prismaWriteArg = (mock: { mock: { calls: unknown[][] } }) =>
  mock.mock.calls[0][0] as { data: Record<string, unknown> };

const expectPersistedBareKey = (value: unknown, expected: string) => {
  expect(typeof value).toBe('string');
  const key = value as string;
  expect(key).toBe(expected);
  expect(key).not.toMatch(/^https?:\/\//);
  expect(key).not.toContain('X-Amz-');
  expect(key).not.toContain('Expires=');
  expect(key).not.toContain('Signature=');
};

const rejectionBody = async (res: Response) => {
  const body = await res.json();
  return body as {
    success?: boolean;
    error?: { name?: string; message?: string };
    code?: string;
  };
};

describe('a read address is refused as an object key on every write path', () => {
  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(
      async (key: string) =>
        `https://signed.oss.invalid/${key}?X-Amz-Signature=deadbeef`,
    );
    mockOss.presignUploadUrl.mockImplementation(
      async (key: string) =>
        `https://signed.oss.invalid/${key}?X-Amz-Signature=deadbeef`,
    );
    mockOss.deleteFile.mockResolvedValue(true);
    mockPrisma.photo.create.mockResolvedValue(photoRow({ id: 21 }));
    mockPrisma.photo.update.mockResolvedValue(photoRow());
    mockPrisma.userInfo.update.mockResolvedValue(userInfoRow());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('creating a photo', () => {
    it('never hands prisma a presigned url submitted as url', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: PRESIGNED_URL,
        thumbnailUrl: 'photos/sunset.thumbnail.jpg',
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.create).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error?.message).toContain('"url"');
    });

    it('never hands prisma a presigned url submitted as thumbnailUrl', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'photos/sunset.jpg',
        thumbnailUrl: PRESIGNED_URL,
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.create).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('thumbnailUrl');
    });

    it('never hands prisma a presigned url on the album-scoped create path either', async () => {
      const res = await post('/api/cms/photos/create/with-album', {
        albumId: 3,
        name: 'Sunset',
        url: PRESIGNED_URL,
        thumbnailUrl: 'photos/sunset.thumbnail.jpg',
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.create).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('"url"');
    });

    it('still accepts the bare keys the uploader produces', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'photos/1767225849260-1685914.jpg',
        thumbnailUrl: 'photos/1767225849260-1685914.thumbnail.jpg',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.photo.create);
      expectPersistedBareKey(arg.data.url, 'photos/1767225849260-1685914.jpg');
      expectPersistedBareKey(
        arg.data.thumbnailUrl,
        'photos/1767225849260-1685914.thumbnail.jpg',
      );
    });

    it('still accepts a flat key with no prefix at all', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'a.jpg',
        thumbnailUrl: 'a.thumbnail.jpg',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.photo.create);
      expectPersistedBareKey(arg.data.url, 'a.jpg');
      expectPersistedBareKey(arg.data.thumbnailUrl, 'a.thumbnail.jpg');
    });
  });

  describe('updating a photo', () => {
    it('never hands prisma a presigned url submitted as url', async () => {
      const res = await post('/api/cms/photos/update', {
        id: 11,
        url: PRESIGNED_URL,
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('"url"');
    });

    it('never hands prisma a presigned url submitted as thumbnailUrl', async () => {
      const res = await post('/api/cms/photos/update', {
        id: 11,
        thumbnailUrl: PRESIGNED_URL,
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('thumbnailUrl');
    });

    it('never hands prisma a presigned url on the album-scoped update path either', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({ albumId: 3 });

      const res = await post('/api/cms/photos/update/with-album', {
        id: 11,
        albumId: 3,
        name: 'Sunset',
        isCover: false,
        url: PRESIGNED_URL,
      });
      const body = await rejectionBody(res);

      expect(mockPrisma.photo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('"url"');
    });

    it('still accepts a bare key, so the tightening is not a blanket break', async () => {
      const res = await post('/api/cms/photos/update', {
        id: 11,
        url: 'photos/harbour.jpg',
        thumbnailUrl: 'photos/harbour.thumbnail.jpg',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.photo.update);
      expectPersistedBareKey(arg.data.url, 'photos/harbour.jpg');
      expectPersistedBareKey(
        arg.data.thumbnailUrl,
        'photos/harbour.thumbnail.jpg',
      );
    });
  });

  describe('updating the user info', () => {
    it('never hands prisma a presigned url submitted as avatar through the RESTful PUT', async () => {
      const res = await put('/api/cms/user-info', userInfoBody(PRESIGNED_URL));
      const body = await rejectionBody(res);

      expect(mockPrisma.userInfo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('avatar');
    });

    it('never hands prisma a presigned url submitted as avatar through the RPC update', async () => {
      const res = await post(
        '/api/cms/user-info/update',
        userInfoBody(PRESIGNED_URL),
      );
      const body = await rejectionBody(res);

      expect(mockPrisma.userInfo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('avatar');
    });

    it('still accepts the bare avatar key the uploader produces', async () => {
      const res = await put(
        '/api/cms/user-info',
        userInfoBody('user/1767225849260-1685914.png'),
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.userInfo.update);
      expectPersistedBareKey(arg.data.avatar, 'user/1767225849260-1685914.png');
    });

    it('still accepts an empty avatar, which is how a client says unchanged', async () => {
      const res = await put('/api/cms/user-info', userInfoBody(''));
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.userInfo.update);
      expect(arg.data.avatar).toBe('');
    });

    it('still accepts an empty avatar through the RPC update too', async () => {
      const res = await post('/api/cms/user-info/update', userInfoBody(''));
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.userInfo.update);
      expect(arg.data.avatar).toBe('');
    });

    it('still rejects a missing avatar, because the field is not optional', async () => {
      const payload = userInfoBody('');
      delete (payload as Record<string, unknown>).avatar;

      const res = await post('/api/cms/user-info/update', payload);
      const body = await rejectionBody(res);

      expect(mockPrisma.userInfo.update).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
    });
  });

  describe('asking for an upload address', () => {
    it('never signs a presigned url handed in as the key', async () => {
      const res = await app.request(
        `/api/cms/system-setting/upload-config?key=${encodeURIComponent(
          PRESIGNED_URL,
        )}`,
      );
      const body = await rejectionBody(res);

      expect(mockOss.presignUploadUrl).not.toHaveBeenCalled();
      expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
      expect(body.error?.message).toContain('key');
    });

    it('still signs a bare object key', async () => {
      const res = await app.request(
        '/api/cms/system-setting/upload-config?key=articles%2F1767225849260-1685914.webp',
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(mockOss.presignUploadUrl).toHaveBeenCalledWith(
        'articles/1767225849260-1685914.webp',
      );
    });

    it('still signs the verify-oss probe prefix the script writes', async () => {
      const res = await app.request(
        '/api/cms/system-setting/upload-config?key=verify-oss-probe%2F9f86d081884c7d659a2feaa0c55ad015.txt',
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(mockOss.presignUploadUrl).toHaveBeenCalledWith(
        'verify-oss-probe/9f86d081884c7d659a2feaa0c55ad015.txt',
      );
    });
  });
});

describe('deleting a photo removes the objects before the row', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fails the whole delete and keeps the row when the object store refuses', async () => {
    mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    mockOss.deleteFile.mockResolvedValue(false);

    const res = await post('/api/cms/photos/delete', { id: 11 });
    const body = await res.json();

    expect(mockPrisma.photo.delete).not.toHaveBeenCalled();
    expect(mockPrisma.photoAlbum.updateMany).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(body.code).toBe('ERR0006');
  });

  it('keeps the row when only the thumbnail delete refuses', async () => {
    mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    mockOss.deleteFile.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const res = await post('/api/cms/photos/delete', { id: 11 });
    const body = await res.json();

    expect(mockPrisma.photo.delete).not.toHaveBeenCalled();
    expect(body.code).toBe('ERR0006');
    expect(mockOss.deleteFile).toHaveBeenCalledTimes(2);
  });

  it('removes the row once both objects are gone', async () => {
    mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    mockOss.deleteFile.mockResolvedValue(true);
    mockPrisma.photo.delete.mockResolvedValue(photoRow());
    mockPrisma.photoAlbum.updateMany.mockResolvedValue({ count: 0 });

    const res = await post('/api/cms/photos/delete', { id: 11 });
    const body = await res.json();

    expect(mockPrisma.photo.delete).toHaveBeenCalledWith({ where: { id: 11 } });
    expect(body.code).toBe('0000');
    expect(mockOss.deleteFile).toHaveBeenCalledTimes(2);
  });

  it('deletes the objects before the row, not the other way round', async () => {
    const order: string[] = [];
    mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    mockOss.deleteFile.mockImplementation(async () => {
      order.push('object');
      return true;
    });
    mockPrisma.photo.delete.mockImplementation(async () => {
      order.push('row');
      return photoRow();
    });
    mockPrisma.photoAlbum.updateMany.mockResolvedValue({ count: 0 });

    await post('/api/cms/photos/delete', { id: 11 });

    expect(order).toEqual(['object', 'object', 'row']);
  });

  it('performs no object delete at all when the photo is absent', async () => {
    mockPrisma.photo.findUnique.mockResolvedValue(null);

    const res = await post('/api/cms/photos/delete', { id: 999999 });
    const body = await res.json();

    expect(mockOss.deleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.photo.delete).not.toHaveBeenCalled();
    expect(body.code).toBe('ERR0007');
  });
});
