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
  deleteFile: vi.fn(async () => true),
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

const signatureIn = (url: string): string | null => {
  const match = /X-Amz-Signature=([^&]+)/.exec(url);
  return match ? match[1] : null;
};

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

const expectBareObjectKeys = (payload: {
  url: string;
  thumbnailUrl: string;
}) => {
  expect(payload.url).toBe('photos/sunset.jpg');
  expect(payload.thumbnailUrl).toBe('photos/sunset.thumbnail.jpg');
  expect(payload.url.startsWith('http')).toBe(false);
  expect(payload.thumbnailUrl.startsWith('http')).toBe(false);
  expect(payload.url).not.toContain('X-Amz-Signature');
  expect(payload.thumbnailUrl).not.toContain('X-Amz-Signature');
};

const expectIndependentlySignedPair = (payload: {
  signedUrl: string;
  signedThumbnailUrl: string;
}) => {
  expect(payload.signedUrl).toBe(presignedUrlFor('photos/sunset.jpg'));
  expect(payload.signedThumbnailUrl).toBe(
    presignedUrlFor('photos/sunset.thumbnail.jpg'),
  );
  expect(payload.signedUrl).not.toBe(payload.signedThumbnailUrl);
  expect(signatureIn(payload.signedThumbnailUrl)).not.toBe(
    signatureIn(payload.signedUrl),
  );
};

const get = (path: string) => app.request(path);

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('CMS signed object storage contract through the real app, service and error handler', () => {
  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('the photo list keeps bare object keys beside independently signed read addresses', () => {
    beforeEach(() => {
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);
    });

    it('emits the stored object keys in url and thumbnailUrl', async () => {
      const res = await get('/api/cms/photos?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(body.code).toBe('0000');
      expectBareObjectKeys(item);
    });

    it('emits signedUrl and signedThumbnailUrl next to those unchanged bare keys', async () => {
      const res = await get('/api/cms/photos?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(Object.keys(item).sort()).toEqual([
        'albumId',
        'createdAt',
        'id',
        'name',
        'signedThumbnailUrl',
        'signedUrl',
        'thumbnailUrl',
        'updatedAt',
        'url',
      ]);
      expectIndependentlySignedPair(item);
    });

    it('signs the thumbnail for its own key, so the original signature cannot be reused for it', async () => {
      const res = await get('/api/cms/photos?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(signatureIn(item.signedThumbnailUrl)).toBe(
        signatureForKey('photos/sunset.thumbnail.jpg'),
      );
      expect(signatureIn(item.signedThumbnailUrl)).not.toBe(
        signatureForKey('photos/sunset.jpg'),
      );
    });

    it('asks the signer for both object keys rather than deriving one address from the other', async () => {
      await get('/api/cms/photos?page=1&pageSize=10');

      const signedKeys = mockOss.presignDownloadUrl.mock.calls.map(
        (call) => call[0],
      );
      expect(signedKeys).toEqual(
        expect.arrayContaining([
          'photos/sunset.jpg',
          'photos/sunset.thumbnail.jpg',
        ]),
      );
    });
  });

  describe('the empty album photo list signs every returned photo', () => {
    beforeEach(() => {
      mockPrisma.photo.findMany.mockResolvedValue([
        photoRow({ id: 11 }),
        photoRow({
          id: 12,
          url: 'photos/harbour.jpg',
          thumbnailUrl: 'photos/harbour.thumbnail.jpg',
        }),
      ]);
    });

    it('signs each photo separately instead of reusing the first photo read address', async () => {
      const res = await get('/api/cms/photos/empty-album');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toHaveLength(2);
      expectBareObjectKeys(body.data[0]);
      expectIndependentlySignedPair(body.data[0]);
      expect(body.data[1].url).toBe('photos/harbour.jpg');
      expect(body.data[1].signedUrl).toBe(
        presignedUrlFor('photos/harbour.jpg'),
      );
      expect(body.data[1].signedThumbnailUrl).toBe(
        presignedUrlFor('photos/harbour.thumbnail.jpg'),
      );
      expect(
        new Set(body.data.map((item: { signedUrl: string }) => item.signedUrl))
          .size,
      ).toBe(2);
    });
  });

  describe('the photo detail signs both read addresses', () => {
    beforeEach(() => {
      mockPrisma.photo.findUnique.mockResolvedValue(photoRow());
    });

    it('returns bare keys plus two independently signed addresses', async () => {
      const res = await get('/api/cms/photos/detail?id=11');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expectBareObjectKeys(body.data);
      expectIndependentlySignedPair(body.data);
    });
  });

  describe('a newly created photo is signed on the way back', () => {
    beforeEach(() => {
      mockPrisma.photo.create.mockResolvedValue(photoRow({ id: 21 }));
    });

    it('returns the stored keys and signs both read addresses of the created row', async () => {
      const res = await post('/api/cms/photos/create', {
        name: 'Sunset',
        url: 'photos/sunset.jpg',
        thumbnailUrl: 'photos/sunset.thumbnail.jpg',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expectBareObjectKeys(body.data);
      expectIndependentlySignedPair(body.data);
    });
  });

  describe('an updated photo is signed on the way back', () => {
    beforeEach(() => {
      mockPrisma.photo.update.mockResolvedValue(photoRow());
    });

    it('signs both read addresses of the updated row', async () => {
      const res = await post('/api/cms/photos/update', {
        id: 11,
        name: 'Sunset renamed',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expectBareObjectKeys(body.data);
      expectIndependentlySignedPair(body.data);
    });

    it('signs both read addresses of the row updated together with its album', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({ albumId: 3 });

      const res = await post('/api/cms/photos/update/with-album', {
        id: 11,
        albumId: 3,
        name: 'Sunset renamed',
        isCover: false,
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expectBareObjectKeys(body.data);
      expectIndependentlySignedPair(body.data);
    });
  });

  describe('article body images are signed per supplied key', () => {
    it('signs every supplied image key independently and keeps the submitted order', async () => {
      const res = await post('/api/cms/articles/upload-images', {
        images: ['articles/first.jpg', 'articles/second.jpg'],
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toEqual([
        presignedUrlFor('articles/first.jpg'),
        presignedUrlFor('articles/second.jpg'),
      ]);
    });

    it('fails the whole request with ERR0006 when one image cannot be signed', async () => {
      mockOss.presignDownloadUrl.mockRejectedValue(new Error('sign failed'));

      const res = await post('/api/cms/articles/upload-images', {
        images: ['articles/first.jpg', 'articles/second.jpg'],
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });
  });

  describe('the album cover is signed alongside its bare object keys', () => {
    beforeEach(() => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        {
          id: 3,
          name: 'Trips',
          description: 'desc',
          coverId: 11,
          available: true,
          createdAt: new Date('2026-01-02T03:04:05.000Z'),
          updatedAt: new Date('2026-01-02T03:04:05.000Z'),
        },
      ]);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
    });

    it('keeps the cover keys bare and signs the cover independently', async () => {
      const res = await get('/api/cms/photo-albums?page=1&pageSize=10');
      const body = await res.json();
      const cover = body.data.data[0].cover;

      expect(body.code).toBe('0000');
      expectBareObjectKeys(cover);
      expectIndependentlySignedPair(cover);
    });
  });

  describe('the CMS user info signs the avatar into a separate field', () => {
    it('keeps avatar as the stored object key and returns the signed address in signedAvatar', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfoRow());

      const res = await get('/api/cms/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.avatar).toBe('user/avatar.jpg');
      expect(body.data.avatar.startsWith('http')).toBe(false);
      expect(body.data.avatar).not.toContain('X-Amz-Signature');
      expect(body.data.signedAvatar).toBe(presignedUrlFor('user/avatar.jpg'));
      expect(body.data.signedAvatar).not.toBe(body.data.avatar);
    });

    it('reports an empty signedAvatar and signs nothing for an empty avatar key', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ avatar: '' }),
      );

      const res = await get('/api/cms/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.avatar).toBe('');
      expect(body.data.signedAvatar).toBe('');
      expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
    });

    it('reports an empty signedAvatar for a null avatar rather than signing the empty key', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ avatar: null }),
      );

      const res = await get('/api/cms/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.avatar).toBeNull();
      expect(body.data.signedAvatar).toBe('');
      expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
    });
  });

  describe('a signing failure fails the whole read', () => {
    beforeEach(() => {
      mockOss.presignDownloadUrl.mockRejectedValue(new Error('signing failed'));
    });

    it('answers ERR0006 on the photo list instead of a photo with an unusable address', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);

      const res = await get('/api/cms/photos?page=1&pageSize=10');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0006 on the album list rather than shipping a cover with an unusable address', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        {
          id: 3,
          name: 'Trips',
          description: 'desc',
          coverId: 11,
          available: true,
          createdAt: new Date('2026-01-02T03:04:05.000Z'),
          updatedAt: new Date('2026-01-02T03:04:05.000Z'),
        },
      ]);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);

      const res = await get('/api/cms/photo-albums?page=1&pageSize=10');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0006 on the user info read rather than an empty avatar', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfoRow());

      const res = await get('/api/cms/user-info');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });
  });
});
