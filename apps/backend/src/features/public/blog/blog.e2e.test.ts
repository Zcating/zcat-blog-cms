import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  article: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photoAlbum: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photo: { findMany: vi.fn() },
  userInfo: { findUnique: vi.fn() },
}));

const mockOss = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => url || ''),
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOss,
}));

vi.mock('../../../common/statistic-service', () => ({
  recordVisitor: vi.fn(),
}));

import { app } from '../../../app';

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
