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

const signatureForKey = (key: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

const presignedUrlFor = (key: string): string =>
  `https://signed.oss.invalid/${key}?X-Amz-Signature=${signatureForKey(key)}`;

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

const expectPersistedBareKey = (value: unknown, expected: string) => {
  expect(typeof value).toBe('string');
  const key = value as string;
  expect(key).toBe(expected);
  expect(key).not.toMatch(/^https?:\/\//);
  expect(key).not.toContain('X-Amz-');
  expect(key).not.toContain('Expires=');
  expect(key).not.toContain('Signature=');
  expect(key).not.toContain('oss');
};

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

describe('CMS write paths persist bare object keys, never a read address', () => {
  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
    mockOss.presignUploadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
    mockOss.deleteFile.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('creating a photo hands prisma the bare object keys', () => {
    beforeEach(() => {
      mockPrisma.photo.create.mockResolvedValue(photoRow({ id: 21 }));
    });

    it('persists url and thumbnailUrl exactly as submitted, with no scheme or signature', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'photos/sunset.jpg',
        thumbnailUrl: 'photos/sunset.thumbnail.jpg',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(mockPrisma.photo.create).toHaveBeenCalledTimes(1);
      const arg = prismaWriteArg(mockPrisma.photo.create);
      expectPersistedBareKey(arg.data.url, 'photos/sunset.jpg');
      expectPersistedBareKey(
        arg.data.thumbnailUrl,
        'photos/sunset.thumbnail.jpg',
      );
    });

    it('does not let the signed read addresses leak into the create payload', async () => {
      await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'photos/sunset.jpg',
        thumbnailUrl: 'photos/sunset.thumbnail.jpg',
      });

      const arg = prismaWriteArg(mockPrisma.photo.create);
      expect(Object.keys(arg.data).sort()).toEqual([
        'albumId',
        'name',
        'thumbnailUrl',
        'url',
      ]);
      expect(arg.data).not.toHaveProperty('signedUrl');
      expect(arg.data).not.toHaveProperty('signedThumbnailUrl');
    });
  });

  describe('updating a photo hands prisma the bare object keys', () => {
    beforeEach(() => {
      mockPrisma.photo.update.mockResolvedValue(photoRow());
    });

    it('persists a submitted url as a bare key', async () => {
      const res = await post('/api/cms/photos/update', {
        id: 11,
        name: 'Sunset renamed',
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

    it('persists bare keys through the album-scoped update', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({ albumId: 3 });

      const res = await post('/api/cms/photos/update/with-album', {
        id: 11,
        albumId: 3,
        name: 'Sunset renamed',
        isCover: false,
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

  describe('updating the user info persists a bare avatar key', () => {
    beforeEach(() => {
      mockPrisma.userInfo.update.mockResolvedValue(userInfoRow());
    });

    it('persists avatar as the bare key through the RESTful PUT', async () => {
      const res = await put(
        '/api/cms/user-info',
        userInfoBody('user/avatar.jpg'),
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.userInfo.update);
      expectPersistedBareKey(arg.data.avatar, 'user/avatar.jpg');
    });

    it('persists avatar as the bare key through the RPC update', async () => {
      const res = await post(
        '/api/cms/user-info/update',
        userInfoBody('user/avatar.jpg'),
      );
      const body = await res.json();

      expect(body.code).toBe('0000');
      const arg = prismaWriteArg(mockPrisma.userInfo.update);
      expectPersistedBareKey(arg.data.avatar, 'user/avatar.jpg');
    });

    it('answers the write with the bare avatar and a separate signedAvatar, so the round trip never narrows into avatar', async () => {
      const res = await put(
        '/api/cms/user-info',
        userInfoBody('user/avatar.jpg'),
      );
      const body = await res.json();

      expect(body.data.avatar).toBe('user/avatar.jpg');
      expect(body.data.avatar.startsWith('http')).toBe(false);
      expect(body.data.signedAvatar).toBe(presignedUrlFor('user/avatar.jpg'));
      expect(body.data.signedAvatar).not.toBe(body.data.avatar);
    });

    it('answers the RPC write with the bare avatar and a separate signedAvatar', async () => {
      const res = await post(
        '/api/cms/user-info/update',
        userInfoBody('user/avatar.jpg'),
      );
      const body = await res.json();

      expect(body.data.avatar).toBe('user/avatar.jpg');
      expect(body.data.avatar.startsWith('http')).toBe(false);
      expect(body.data.signedAvatar).toBe(presignedUrlFor('user/avatar.jpg'));
      expect(body.data.signedAvatar).not.toBe(body.data.avatar);
    });
  });
});

describe('the upload config presigns a write address and leaks no read address', () => {
  beforeEach(() => {
    mockOss.presignUploadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks the uploader signer for the key rather than the download signer', async () => {
    const res = await app.request(
      '/api/cms/system-setting/upload-config?key=photos%2Fupload.jpg',
    );
    const body = await res.json();

    expect(body.code).toBe('0000');
    expect(mockOss.presignUploadUrl).toHaveBeenCalledWith('photos/upload.jpg');
    expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
  });

  it('returns only the presigned upload address, with no download address beside it', async () => {
    const res = await app.request(
      '/api/cms/system-setting/upload-config?key=photos%2Fupload.jpg',
    );
    const body = await res.json();

    expect(Object.keys(body.data).sort()).toEqual(['presignedUrl']);
    expect(body).not.toHaveProperty('signedUrl');
    expect(JSON.stringify(body)).not.toContain('signedThumbnailUrl');
    expect(JSON.stringify(body)).not.toContain('signedAvatar');
  });

  it('derives the upload address from the requested key', async () => {
    const res = await app.request(
      '/api/cms/system-setting/upload-config?key=photos%2Fupload.jpg',
    );
    const body = await res.json();

    expect(body.data.presignedUrl).toBe(presignedUrlFor('photos/upload.jpg'));
  });

  it('answers ERR0006 when the upload address cannot be signed', async () => {
    mockOss.presignUploadUrl.mockRejectedValue(new Error('sign failed'));

    const res = await app.request(
      '/api/cms/system-setting/upload-config?key=photos%2Fupload.jpg',
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.code).toBe('ERR0006');
    expect(body).not.toHaveProperty('data');
  });
});

describe('the photo delete path removes both stored objects by their bare keys', () => {
  beforeEach(() => {
    mockOss.deleteFile.mockResolvedValue(true);
    mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    mockPrisma.photo.delete.mockResolvedValue(photoRow());
    mockPrisma.photoAlbum.updateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the original and the thumbnail, not just one of them', async () => {
    const res = await post('/api/cms/photos/delete', { id: 11 });
    const body = await res.json();

    expect(body.code).toBe('0000');
    expect(mockOss.deleteFile).toHaveBeenCalledTimes(2);
  });

  it('hands the object store the bare stored keys, not a signed address', async () => {
    await post('/api/cms/photos/delete', { id: 11 });

    const deletedKeys = mockOss.deleteFile.mock.calls.map((call) => call[0]);
    expectPersistedBareKey(deletedKeys[0], 'photos/sunset.jpg');
    expectPersistedBareKey(deletedKeys[1], 'photos/sunset.thumbnail.jpg');
  });

  it('never signs a download address as part of deleting a row', async () => {
    await post('/api/cms/photos/delete', { id: 11 });

    expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
    expect(mockOss.presignUploadUrl).not.toHaveBeenCalled();
  });
});
