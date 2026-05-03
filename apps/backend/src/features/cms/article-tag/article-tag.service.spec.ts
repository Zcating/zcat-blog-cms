import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  articleTag: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../services', () => ({
  prismaService: mockPrisma,
}));

import { articleTagService } from './article-tag.service';

describe('articleTagService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all article tags', async () => {
      const tags = [{ id: 1, name: 'tag1' }];
      mockPrisma.articleTag.findMany.mockResolvedValue(tags);

      const result = await articleTagService.findAll();

      expect(result).toEqual(tags);
      expect(mockPrisma.articleTag.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findById', () => {
    it('returns tag by id', async () => {
      const tag = { id: 1, name: 'tag1' };
      mockPrisma.articleTag.findUnique.mockResolvedValue(tag);

      const result = await articleTagService.findById('1');

      expect(result).toEqual(tag);
      expect(mockPrisma.articleTag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('create', () => {
    it('creates a new tag', async () => {
      const tag = { id: 1, name: 'new-tag' };
      mockPrisma.articleTag.create.mockResolvedValue(tag);

      const result = await articleTagService.create({ name: 'new-tag' });

      expect(result).toEqual(tag);
      expect(mockPrisma.articleTag.create).toHaveBeenCalledWith({
        data: { name: 'new-tag' },
      });
    });
  });

  describe('update', () => {
    it('updates a tag by id', async () => {
      const tag = { id: 1, name: 'updated' };
      mockPrisma.articleTag.update.mockResolvedValue(tag);

      const result = await articleTagService.update('1', { name: 'updated' });

      expect(result).toEqual(tag);
      expect(mockPrisma.articleTag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'updated' },
      });
    });
  });

  describe('delete', () => {
    it('deletes a tag by id', async () => {
      mockPrisma.articleTag.delete.mockResolvedValue({ id: 1 });

      await articleTagService.delete('1');

      expect(mockPrisma.articleTag.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
