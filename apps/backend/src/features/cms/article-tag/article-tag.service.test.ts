import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  articleTag: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../common/prisma.service', () => ({
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

      const result = await appRuntime.runPromise(articleTagService.findAll());

      expect(result).toEqual(tags);
      expect(mockPrisma.articleTag.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findById', () => {
    it('returns tag by id', async () => {
      const tag = { id: 1, name: 'tag1' };
      mockPrisma.articleTag.findUnique.mockResolvedValue(tag);

      const result = await appRuntime.runPromise(
        articleTagService.findById('1'),
      );

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

      const result = await appRuntime.runPromise(
        articleTagService.create({ name: 'new-tag' }),
      );

      expect(result).toEqual(tag);
      expect(mockPrisma.articleTag.create).toHaveBeenCalledWith({
        data: { name: 'new-tag' },
      });
    });
  });

  describe('update', () => {
    it('updates a tag by id', async () => {
      const tag = { id: 1, name: 'updated' };
      mockPrisma.articleTag.findUnique.mockResolvedValue({
        id: 1,
        name: 'tag1',
      });
      mockPrisma.articleTag.update.mockResolvedValue(tag);

      const result = await appRuntime.runPromise(
        articleTagService.update('1', { name: 'updated' }),
      );

      expect(result).toEqual(tag);
      expect(mockPrisma.articleTag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'updated' },
      });
    });

    it('returns null instead of throwing when the row does not exist', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(
        articleTagService.update('999', { name: 'updated' }),
      );

      expect(result).toBeNull();
      expect(mockPrisma.articleTag.update).not.toHaveBeenCalled();
    });

    it('propagates a genuine database failure rather than reporting absence', async () => {
      mockPrisma.articleTag.findUnique.mockResolvedValue({
        id: 1,
        name: 'tag1',
      });
      mockPrisma.articleTag.update.mockRejectedValue(new Error('db down'));

      await expect(
        appRuntime.runPromise(
          articleTagService.update('1', { name: 'updated' }),
        ),
      ).rejects.toThrow('db down');
    });
  });

  describe('delete', () => {
    it('deletes a tag by id', async () => {
      mockPrisma.articleTag.delete.mockResolvedValue({ id: 1 });

      await appRuntime.runPromise(articleTagService.delete('1'));

      expect(mockPrisma.articleTag.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
