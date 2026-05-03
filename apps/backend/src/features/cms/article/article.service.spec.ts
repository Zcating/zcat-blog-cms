import { describe, expect, it, vi } from 'vitest';

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

vi.mock('../../../services', () => ({
  prismaService: mockPrisma,
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

      const result = await articleService.findAll(1, 10);

      expect(result.data).toEqual(articles);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('calculates totalPages correctly', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(25);

      const result = await articleService.findAll(1, 10);

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('returns article when found', async () => {
      const article = { id: 1, title: 'Test' };
      mockPrisma.article.findUnique.mockResolvedValue(article);

      const result = await articleService.findById('1');

      expect(result).toEqual(article);
    });

    it('returns null when id is invalid', async () => {
      const result = await articleService.findById('0');

      expect(result).toBeNull();
      expect(mockPrisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const result = await articleService.findById('1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates an article', async () => {
      const dto = { title: 'New', excerpt: 'Exc', content: 'Cont' };
      const created = { id: 1, ...dto };
      mockPrisma.article.create.mockResolvedValue(created);

      const result = await articleService.create(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.article.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('updates an article', async () => {
      const dto = { id: 1, title: 'Updated' };
      const updated = { id: 1, title: 'Updated' };
      mockPrisma.article.update.mockResolvedValue(updated);

      const result = await articleService.update(dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });
  });

  describe('delete', () => {
    it('deletes article when id is valid', async () => {
      mockPrisma.article.delete.mockResolvedValue({ id: 1 });

      const result = await articleService.delete('1');

      expect(result).toBe(true);
    });

    it('returns false when id is invalid', async () => {
      const result = await articleService.delete('0');

      expect(result).toBe(false);
      expect(mockPrisma.article.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUploadUrls', () => {
    it('returns upload URLs for images', () => {
      mockOssService.getArticleUrl
        .mockReturnValueOnce('url1')
        .mockReturnValueOnce('url2');

      const result = articleService.getUploadUrls(['img1', 'img2']);

      expect(result).toEqual(['url1', 'url2']);
      expect(mockOssService.getArticleUrl).toHaveBeenCalledTimes(2);
    });
  });
});
