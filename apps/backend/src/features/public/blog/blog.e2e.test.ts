import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  article: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photoAlbum: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photo: { findMany: vi.fn(), count: vi.fn() },
  userInfo: { findUnique: vi.fn() },
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

const mockOss = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  deleteFile: vi.fn(),
  presignUploadUrl: vi.fn(),
  presignDownloadUrl: vi.fn(),
}));

vi.mock('../../../common/statistic-service', () => ({
  recordVisitor: vi.fn(),
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOss,
}));

import { app } from '../../../app';

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

describe('blog public API e2e', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports a missing article as ERR0007 through the real app wiring', async () => {
    mockPrisma.article.findUnique.mockResolvedValue(null);

    const res = await app.request('/api/blog/article/1');
    const body = await res.json();

    expect(body.code).toBe('ERR0007');
    expect(body).not.toHaveProperty('data');
  });

  it('reports a database fault on the article endpoint as ERR0006, not ERR0007', async () => {
    mockPrisma.article.findUnique.mockRejectedValue(new Error('db error'));

    const res = await app.request('/api/blog/article/1');
    const body = await res.json();

    expect(body.code).toBe('ERR0006');
  });

  it('reports a missing album as ERR0007 instead of a null success payload', async () => {
    mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

    const res = await app.request('/api/blog/gallery/999');
    const body = await res.json();

    expect(body.code).toBe('ERR0007');
    expect(body).not.toHaveProperty('data');
  });

  it('reports a database fault on the album endpoint as ERR0006, not ERR0007', async () => {
    mockPrisma.photoAlbum.findUnique.mockRejectedValue(new Error('db error'));

    const res = await app.request('/api/blog/gallery/999');
    const body = await res.json();

    expect(body.code).toBe('ERR0006');
  });

  it('returns the whole pagination result shape for the album list', async () => {
    mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
    mockPrisma.photoAlbum.count.mockResolvedValue(7);

    const res = await app.request('/api/blog/gallery?page=2&pageSize=2');
    const body = await res.json();

    expect(body.code).toBe('0000');
    expect(body.data.total).toBe(7);
    expect(body.data.totalPages).toBe(4);
    expect(Object.keys(body.data).sort()).toEqual([
      'data',
      'page',
      'pageSize',
      'total',
      'totalPages',
    ]);
  });
});

describe('blog public API signed object storage contract', () => {
  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('the photo feed keeps bare object keys beside the signed read addresses', () => {
    beforeEach(() => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        { id: 3, name: 'Trips' },
      ]);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);
    });

    it('emits url and thumbnailUrl as the stored object keys, not as signed urls', async () => {
      const res = await app.request('/api/blog/photo/list?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(body.code).toBe('0000');
      expect(item.url).toBe('photos/sunset.jpg');
      expect(item.thumbnailUrl).toBe('photos/sunset.thumbnail.jpg');
      expect(item.url).not.toContain('X-Amz-Signature');
      expect(item.thumbnailUrl).not.toContain('X-Amz-Signature');
      expect(item.url.startsWith('http')).toBe(false);
      expect(item.thumbnailUrl.startsWith('http')).toBe(false);
    });

    it('adds signedUrl and signedThumbnailUrl next to those unchanged bare keys', async () => {
      const res = await app.request('/api/blog/photo/list?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(Object.keys(item).sort()).toEqual([
        'albumId',
        'albumName',
        'createdAt',
        'id',
        'name',
        'signedThumbnailUrl',
        'signedUrl',
        'thumbnailUrl',
        'updatedAt',
        'url',
      ]);
      expect(item.signedUrl).toBe(presignedUrlFor('photos/sunset.jpg'));
      expect(item.signedThumbnailUrl).toBe(
        presignedUrlFor('photos/sunset.thumbnail.jpg'),
      );
    });
  });

  describe('the thumbnail read address is signed for its own key', () => {
    beforeEach(() => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        { id: 3, name: 'Trips' },
      ]);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);
    });

    it('addresses the thumbnail object rather than the original', async () => {
      const res = await app.request('/api/blog/photo/list?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(item.signedThumbnailUrl).toContain(
        '/photos/sunset.thumbnail.jpg?',
      );
      expect(item.signedUrl).toContain('/photos/sunset.jpg?');
      expect(item.signedThumbnailUrl).not.toBe(item.signedUrl);
    });

    it('carries a signature computed from the thumbnail key, so rewriting the key inside the original signature cannot produce it', async () => {
      const res = await app.request('/api/blog/photo/list?page=1&pageSize=10');
      const body = await res.json();
      const item = body.data.data[0];

      expect(signatureIn(item.signedThumbnailUrl)).toBe(
        signatureForKey('photos/sunset.thumbnail.jpg'),
      );
      expect(signatureIn(item.signedThumbnailUrl)).not.toBe(
        signatureForKey('photos/sunset.jpg'),
      );
    });

    it('signs both objects instead of deriving one read address from the other', async () => {
      await app.request('/api/blog/photo/list?page=1&pageSize=10');

      const signedKeys = mockOss.presignDownloadUrl.mock.calls.map(
        (call) => call[0],
      );
      expect(signedKeys).toContain('photos/sunset.jpg');
      expect(signedKeys).toContain('photos/sunset.thumbnail.jpg');
    });
  });

  describe('the gallery list signs the album cover', () => {
    beforeEach(() => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        {
          id: 3,
          name: 'Trips',
          description: 'desc',
          coverId: 11,
          createdAt: new Date('2026-01-02T03:04:05.000Z'),
          updatedAt: new Date('2026-01-02T03:04:05.000Z'),
        },
      ]);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
    });

    it('keeps the cover object keys bare and signs both of them independently', async () => {
      const res = await app.request('/api/blog/gallery?page=1&pageSize=10');
      const body = await res.json();
      const cover = body.data.data[0].cover;

      expect(body.code).toBe('0000');
      expect(cover.url).toBe('photos/sunset.jpg');
      expect(cover.thumbnailUrl).toBe('photos/sunset.thumbnail.jpg');
      expect(cover.signedUrl).toBe(presignedUrlFor('photos/sunset.jpg'));
      expect(cover.signedThumbnailUrl).toBe(
        presignedUrlFor('photos/sunset.thumbnail.jpg'),
      );
      expect(signatureIn(cover.signedThumbnailUrl)).not.toBe(
        signatureIn(cover.signedUrl),
      );
    });
  });

  describe('the gallery detail signs both the cover and the photo list', () => {
    beforeEach(() => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({
        id: 3,
        name: 'Trips',
        coverId: 11,
        description: 'desc',
        createdAt: new Date('2026-01-02T03:04:05.000Z'),
        updatedAt: new Date('2026-01-02T03:04:05.000Z'),
      });
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
    });

    it('returns signed read addresses on the cover and on every listed photo', async () => {
      const res = await app.request('/api/blog/gallery/3');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.cover.signedUrl).toBe(
        presignedUrlFor('photos/sunset.jpg'),
      );
      expect(body.data.cover.signedThumbnailUrl).toBe(
        presignedUrlFor('photos/sunset.thumbnail.jpg'),
      );
      expect(body.data.photos).toHaveLength(1);
      expect(body.data.photos[0].signedUrl).toBe(
        presignedUrlFor('photos/sunset.jpg'),
      );
      expect(body.data.photos[0].signedThumbnailUrl).toBe(
        presignedUrlFor('photos/sunset.thumbnail.jpg'),
      );
      expect(body.data.photos[0].url).toBe('photos/sunset.jpg');
    });
  });

  describe('the blog user info signs the avatar into a separate field', () => {
    it('keeps avatar as the stored object key and returns the signed address in signedAvatar', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue({
        name: 'Admin',
        occupation: 'Developer',
        abstract: 'Abstract',
        aboutMe: 'About me',
        contact: '{"email":"admin@test.com","github":"admin"}',
        avatar: 'user/avatar.jpg',
        createdAt: new Date('2026-01-02T03:04:05.000Z'),
        updatedAt: new Date('2026-01-02T03:04:05.000Z'),
      });

      const res = await app.request('/api/blog/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.avatar).toBe('user/avatar.jpg');
      expect(body.data.avatar.startsWith('http')).toBe(false);
      expect(body.data.avatar).not.toContain('X-Amz-Signature');
      expect(body.data.signedAvatar).toBe(presignedUrlFor('user/avatar.jpg'));
      expect(body.data.signedAvatar).not.toBe(body.data.avatar);
    });

    it('reports an empty signedAvatar and signs nothing when there is no avatar', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/blog/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.avatar).toBe('');
      expect(body.data.signedAvatar).toBe('');
      expect(mockOss.presignDownloadUrl).not.toHaveBeenCalled();
    });
  });

  describe('a signing failure fails the whole read', () => {
    beforeEach(() => {
      mockOss.presignDownloadUrl.mockRejectedValue(new Error('sign failed'));
    });

    it('answers ERR0006 instead of a photo payload with an unusable address', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        { id: 3, name: 'Trips' },
      ]);
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);

      const res = await app.request('/api/blog/photo/list?page=1&pageSize=10');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0006 on the gallery detail read rather than dropping the photos', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({
        id: 3,
        name: 'Trips',
        coverId: 11,
        description: 'desc',
        createdAt: new Date('2026-01-02T03:04:05.000Z'),
        updatedAt: new Date('2026-01-02T03:04:05.000Z'),
      });
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);

      const res = await app.request('/api/blog/gallery/3');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
      expect(body).not.toHaveProperty('data');
    });
  });
});
