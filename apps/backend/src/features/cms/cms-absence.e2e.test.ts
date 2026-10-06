import { z } from 'zod';

const mockPrisma = vi.hoisted(() => {
  const client = {
    photoAlbum: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    photo: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    article: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    articleTag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
  presignUploadUrl: vi.fn(),
  presignDownloadUrl: vi.fn(),
  deleteFile: vi.fn(async () => true),
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

const photoRow = {
  id: 11,
  name: 'Sunset',
  url: 'photos/sunset.jpg',
  thumbnailUrl: 'photos/sunset.thumbnail.jpg',
  albumId: 3,
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  updatedAt: new Date('2026-01-02T03:04:05.000Z'),
};

const clientEnvelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.unknown().optional(),
});

const clientAlbumDetailSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const clientPhotoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  signedUrl: z.string(),
  signedThumbnailUrl: z.string(),
});

const clientArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  excerpt: z.string(),
});

const clientArticleTagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const clientAlbumListSchema = z.object({
  data: z.array(clientAlbumDetailSchema),
});

const clientTagsListSchema = z.array(clientArticleTagSchema);

const CLIENT_TAG_BY_CODE: Record<string, string> = {
  ERR0001: 'RegisterError',
  ERR0002: 'LoginError',
  ERR0003: 'DatabaseError',
  ERR0004: 'UploadError',
  ERR0005: 'ValidationError',
  ERR0006: 'UnknownError',
  ERR0007: 'NotFound',
};

type ClientVerdict =
  | { kind: 'malformed' }
  | { kind: 'api-error'; tag: string }
  | { kind: 'validation-error' }
  | { kind: 'data' };

function classifyAsAdminClient(
  payload: unknown,
  dataSchema: z.ZodType,
): ClientVerdict {
  const envelope = clientEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    return { kind: 'malformed' };
  }
  if (envelope.data.code !== '0000') {
    return {
      kind: 'api-error',
      tag: CLIENT_TAG_BY_CODE[envelope.data.code] ?? 'UnknownError',
    };
  }
  return dataSchema.safeParse(envelope.data.data).success
    ? { kind: 'data' }
    : { kind: 'validation-error' };
}

const get = (path: string) => app.request(path);
const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('CMS absence contract through the real app, service and error handler', () => {
  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('a missing single resource is ERR0007 with no data payload', () => {
    it('answers ERR0007 for a missing album instead of a null success payload', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const res = await get('/api/cms/photo-albums/999999');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 for a missing photo instead of a null success payload', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const res = await get('/api/cms/photos/detail?id=999999');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 for a missing article instead of a database error', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const res = await get('/api/cms/articles/detail?id=999999');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 for a missing article tag instead of a null success payload', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue(null);

      const res = await get('/api/cms/article-tags/999999');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 when adding photos to an album that does not exist', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const res = await post('/api/cms/photo-albums/add-photos', {
        albumId: 999999,
        photoIds: [1],
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 when deleting a photo that does not exist', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const res = await post('/api/cms/photos/delete', { id: 999999 });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('answers ERR0007 when deleting an article by an id that points at no row', async () => {
      const res = await post('/api/cms/articles/delete', {
        id: 'not-a-number',
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
      expect(mockPrisma.article.delete).not.toHaveBeenCalled();
    });

    it('answers ERR0007 when renaming an article tag that does not exist', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/cms/article-tags/999999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'renamed' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });
  });

  describe('a genuine fault stays a fault and never becomes ERR0007', () => {
    const faultCases: Array<[string, string, () => void]> = [
      [
        'album detail',
        '/api/cms/photo-albums/999999',
        () =>
          mockPrisma.photoAlbum.findUnique.mockRejectedValue(
            new Error('db down'),
          ),
      ],
      [
        'photo detail',
        '/api/cms/photos/detail?id=999999',
        () =>
          mockPrisma.photo.findUnique.mockRejectedValue(new Error('db down')),
      ],
      [
        'article detail',
        '/api/cms/articles/detail?id=999999',
        () =>
          mockPrisma.article.findUnique.mockRejectedValue(new Error('db down')),
      ],
      [
        'article tag detail',
        '/api/cms/article-tags/999999',
        () =>
          mockPrisma.articleTag.findUnique.mockRejectedValue(
            new Error('db down'),
          ),
      ],
    ];

    it.each(faultCases)(
      'keeps a %s database fault out of ERR0007',
      async (_name, path, arrange) => {
        arrange();

        const res = await get(path);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.code).not.toBe('ERR0007');
        expect(body.code).toBe('ERR0006');
        expect(body).not.toHaveProperty('data');
      },
    );

    it('keeps a list-endpoint database fault out of ERR0007', async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error('db down'));

      const res = await get('/api/cms/articles');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0006');
    });

    it('keeps a genuine fault on the article-tag rename out of ERR0007', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue({
        id: 1,
        name: 'tag',
      });
      mockPrisma.articleTag.update.mockRejectedValue(new Error('db down'));

      const res = await app.request('/api/cms/article-tags/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'renamed' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('ERR0003');
      expect(body).not.toHaveProperty('data');
    });
  });

  describe('an empty list stays a success with an empty array', () => {
    it('keeps an empty album list a success with an empty data array', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(0);

      const res = await get('/api/cms/photo-albums');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.data).toEqual([]);
      expect(body.data.total).toBe(0);
    });

    it('keeps an empty photo list a success with an empty data array', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const res = await get('/api/cms/photos');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.data).toEqual([]);
    });

    it('keeps an empty article list a success with an empty data array', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const res = await get('/api/cms/articles');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.data).toEqual([]);
    });

    it('keeps an empty article tag list a success with an empty array', async () => {
      mockPrisma.articleTag.findMany.mockResolvedValue([]);

      const res = await get('/api/cms/article-tags');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data).toEqual([]);
    });

    it('keeps an empty empty-album photo list a success with an empty array', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);

      const res = await get('/api/cms/photos/empty-album');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data).toEqual([]);
    });
  });

  describe('the admin client classifies the resulting envelopes', () => {
    it('reads a missing album as a NotFound, which the old null payload could not reach', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const body = await (await get('/api/cms/photo-albums/999999')).json();

      expect(classifyAsAdminClient(body, clientAlbumDetailSchema)).toEqual({
        kind: 'api-error',
        tag: 'NotFound',
      });
      expect(
        classifyAsAdminClient(
          { code: '0000', message: '成功', data: null },
          clientAlbumDetailSchema,
        ),
      ).toEqual({ kind: 'validation-error' });
    });

    it('reads a missing photo as a NotFound, which the old null payload could not reach', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const body = await (await get('/api/cms/photos/detail?id=999999')).json();

      expect(classifyAsAdminClient(body, clientPhotoSchema)).toEqual({
        kind: 'api-error',
        tag: 'NotFound',
      });
      expect(
        classifyAsAdminClient(
          { code: '0000', message: '成功', data: null },
          clientPhotoSchema,
        ),
      ).toEqual({ kind: 'validation-error' });
    });

    it('reads a missing article as a NotFound, which a database error could not reach', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const body = await (
        await get('/api/cms/articles/detail?id=999999')
      ).json();

      expect(classifyAsAdminClient(body, clientArticleSchema)).toEqual({
        kind: 'api-error',
        tag: 'NotFound',
      });
      expect(
        classifyAsAdminClient(
          { code: 'ERR0003', message: '未找到文章' },
          clientArticleSchema,
        ),
      ).toEqual({ kind: 'api-error', tag: 'DatabaseError' });
    });

    it('reads a missing article tag as a NotFound, which the old null payload could not reach', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue(null);

      const body = await (await get('/api/cms/article-tags/999999')).json();

      expect(classifyAsAdminClient(body, clientArticleTagSchema)).toEqual({
        kind: 'api-error',
        tag: 'NotFound',
      });
      expect(
        classifyAsAdminClient(
          { code: '0000', message: '成功', data: null },
          clientArticleTagSchema,
        ),
      ).toEqual({ kind: 'validation-error' });
    });

    it('reads a genuine fault as a fault rather than a NotFound', async () => {
      mockPrisma.photoAlbum.findUnique.mockRejectedValue(new Error('db down'));

      const body = await (await get('/api/cms/photo-albums/999999')).json();

      expect(classifyAsAdminClient(body, clientAlbumDetailSchema)).toEqual({
        kind: 'api-error',
        tag: 'UnknownError',
      });
    });

    it('reads an empty list as data rather than an ApiError', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(0);

      const body = await (await get('/api/cms/photo-albums')).json();

      expect(classifyAsAdminClient(body, clientAlbumListSchema)).toEqual({
        kind: 'data',
      });
    });

    it('reads an empty article tag list as data rather than an ApiError', async () => {
      mockPrisma.articleTag.findMany.mockResolvedValue([]);

      const body = await (await get('/api/cms/article-tags')).json();

      expect(classifyAsAdminClient(body, clientTagsListSchema)).toEqual({
        kind: 'data',
      });
    });
  });
});

describe('the admin client photo schema against a real success payload', () => {
  const clientPhotoListSchema = z.object({
    data: z.array(clientPhotoSchema),
  });

  const photoList = async () => {
    mockPrisma.photo.findMany.mockResolvedValue([photoRow]);
    mockPrisma.photo.count.mockResolvedValue(1);
    return (await get('/api/cms/photos?page=1&pageSize=10')).json();
  };

  beforeEach(() => {
    mockOss.presignDownloadUrl.mockImplementation(async (key: string) =>
      presignedUrlFor(key),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reaches the photo schema and accepts a signed photo payload as data', async () => {
    const body = await photoList();

    expect(body.code).toBe('0000');
    expect(classifyAsAdminClient(body, clientPhotoListSchema)).toEqual({
      kind: 'data',
    });
  });

  it('carries both signed read addresses alongside the unchanged bare object keys', async () => {
    const body = await photoList();
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
    expect(item.url).toBe('photos/sunset.jpg');
    expect(item.thumbnailUrl).toBe('photos/sunset.thumbnail.jpg');
    expect(item.signedUrl).toBe(presignedUrlFor('photos/sunset.jpg'));
    expect(item.signedThumbnailUrl).toBe(
      presignedUrlFor('photos/sunset.thumbnail.jpg'),
    );
  });

  it('reads the same payload as a validation error once the signed fields are gone, so the acceptance above is not vacuous', async () => {
    const body = await photoList();
    const stripped = {
      ...body,
      data: {
        ...body.data,
        data: body.data.data.map(
          ({
            signedUrl,
            signedThumbnailUrl,
            ...bare
          }: Record<string, unknown>) => bare,
        ),
      },
    };

    expect(classifyAsAdminClient(stripped, clientPhotoListSchema)).toEqual({
      kind: 'validation-error',
    });
  });
});
