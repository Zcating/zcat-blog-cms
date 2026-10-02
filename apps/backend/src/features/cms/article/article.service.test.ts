import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  article: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockOssService = vi.hoisted(() => ({
  getArticleUrl: vi.fn(),
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

import { articleService } from './article.service';

describe('articleService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated articles', async () => {
      const articles = [
        {
          id: 1,
          title: 'Article 1',
          excerpt: 'Excerpt',
          createdAt: new Date(),
          updatedAt: new Date(),
          createByUserId: 1,
          publishAt: new Date(),
        },
      ];
      mockPrisma.article.findMany.mockResolvedValue(articles);
      mockPrisma.article.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(articleService.findAll(1, 10));

      expect(result.data).toEqual(articles);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('calculates totalPages correctly', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(25);

      const result = await appRuntime.runPromise(articleService.findAll(1, 10));

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('returns article when found', async () => {
      const article = { id: 1, title: 'Test' };
      mockPrisma.article.findUnique.mockResolvedValue(article);

      const result = await appRuntime.runPromise(articleService.findById('1'));

      expect(result).toEqual(article);
    });

    it('returns null when id is invalid', async () => {
      const result = await appRuntime.runPromise(articleService.findById('0'));

      expect(result).toBeNull();
      expect(mockPrisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(articleService.findById('1'));

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates an article', async () => {
      const dto = { title: 'New', excerpt: 'Exc', content: 'Cont' };
      const created = { id: 1, ...dto };
      mockPrisma.article.create.mockResolvedValue(created);

      const result = await appRuntime.runPromise(articleService.create(dto));

      expect(result).toEqual(created);
      expect(mockPrisma.article.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('updates an article', async () => {
      const dto = { id: 1, title: 'Updated' };
      const updated = { id: 1, title: 'Updated' };
      mockPrisma.article.update.mockResolvedValue(updated);

      const result = await appRuntime.runPromise(articleService.update(dto));

      expect(result).toEqual(updated);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated' },
      });
    });
  });

  describe('delete', () => {
    it('deletes article when id is valid', async () => {
      mockPrisma.article.delete.mockResolvedValue({ id: 1 });

      const result = await appRuntime.runPromise(articleService.delete('1'));

      expect(result).toBe(true);
    });

    it('returns false when id is invalid', async () => {
      const result = await appRuntime.runPromise(articleService.delete('0'));

      expect(result).toBe(false);
      expect(mockPrisma.article.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUploadUrls', () => {
    it('returns upload URLs for images', async () => {
      mockOssService.getArticleUrl
        .mockReturnValueOnce('url1')
        .mockReturnValueOnce('url2');

      const result = await appRuntime.runPromise(
        articleService.getUploadUrls(['img1', 'img2']),
      );

      expect(result).toEqual(['url1', 'url2']);
      expect(mockOssService.getArticleUrl).toHaveBeenCalledTimes(2);
    });
  });
});