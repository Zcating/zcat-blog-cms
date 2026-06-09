import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  tokenWhitelist: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

import { tokenWhitelistService } from './whitelist.service';

describe('tokenWhitelistService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a whitelist entry with hashed token', async () => {
      const mockEntry = {
        id: 1,
        tokenHash: 'abc123hash',
        userId: 1,
        device: 'Chrome',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockPrisma.tokenWhitelist.create.mockResolvedValue(mockEntry);

      const result = await appRuntime.runPromise(
        tokenWhitelistService.create({
          token: 'my-jwt-token',
          userId: 1,
          device: 'Chrome',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          expiresAt: new Date('2026-12-31'),
        }),
      );

      expect(result).toEqual(mockEntry);
      expect(mockPrisma.tokenWhitelist.create).toHaveBeenCalledWith({
        data: {
          tokenHash: expect.any(String),
          userId: 1,
          device: 'Chrome',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          expiresAt: new Date('2026-12-31'),
        },
      });
      expect(
        mockPrisma.tokenWhitelist.create.mock.calls[0][0].data.tokenHash,
      ).toHaveLength(64);
    });

    it('handles optional fields as null', async () => {
      mockPrisma.tokenWhitelist.create.mockResolvedValue({
        id: 2,
        tokenHash: 'hash',
        userId: 1,
        device: null,
        ip: null,
        userAgent: null,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await appRuntime.runPromise(
        tokenWhitelistService.create({
          token: 'token',
          userId: 1,
          expiresAt: new Date(),
        }),
      );

      expect(result).toBeDefined();
      expect(
        mockPrisma.tokenWhitelist.create.mock.calls[0][0].data.device,
      ).toBeNull();
    });
  });

  describe('validate', () => {
    it('returns true for a valid token in whitelist', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockPrisma.tokenWhitelist.findUnique.mockResolvedValue({
        id: 1,
        tokenHash: 'hash',
        userId: 1,
        expiresAt: futureDate,
      });

      const result = await appRuntime.runPromise(
        tokenWhitelistService.validate('valid-token'),
      );
      expect(result).toBe(true);
    });

    it('returns false when token not in whitelist', async () => {
      mockPrisma.tokenWhitelist.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(
        tokenWhitelistService.validate('unknown-token'),
      );
      expect(result).toBe(false);
    });

    it('returns false and deletes expired token', async () => {
      mockPrisma.tokenWhitelist.deleteMany.mockResolvedValue({ count: 1 });
      const pastDate = new Date(Date.now() - 86400000);
      mockPrisma.tokenWhitelist.findUnique.mockResolvedValue({
        id: 1,
        tokenHash: 'hash',
        userId: 1,
        expiresAt: pastDate,
      });

      const result = await appRuntime.runPromise(
        tokenWhitelistService.validate('expired-token'),
      );
      expect(result).toBe(false);
      expect(mockPrisma.tokenWhitelist.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
      });
    });
  });

  describe('remove', () => {
    it('removes token by hash', async () => {
      mockPrisma.tokenWhitelist.deleteMany.mockResolvedValue({ count: 1 });

      await appRuntime.runPromise(tokenWhitelistService.remove('some-token'));
      expect(mockPrisma.tokenWhitelist.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
      });
    });
  });

  describe('removeByUser', () => {
    it('removes all tokens for a user', async () => {
      mockPrisma.tokenWhitelist.deleteMany.mockResolvedValue({ count: 3 });

      await appRuntime.runPromise(tokenWhitelistService.removeByUser(1));
      expect(mockPrisma.tokenWhitelist.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe('removeById', () => {
    it('removes a token by id', async () => {
      mockPrisma.tokenWhitelist.delete.mockResolvedValue({ id: 1 });

      await appRuntime.runPromise(tokenWhitelistService.removeById(1));
      expect(mockPrisma.tokenWhitelist.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findByUser', () => {
    it('returns active tokens for a user', async () => {
      const mockEntries = [
        {
          id: 1,
          device: 'Chrome',
          ip: '::1',
          userAgent: 'Mozilla',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockPrisma.tokenWhitelist.findMany.mockResolvedValue(mockEntries);

      const result = await appRuntime.runPromise(
        tokenWhitelistService.findByUser(1),
      );
      expect(result).toEqual(mockEntries);
      expect(mockPrisma.tokenWhitelist.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          device: true,
          ip: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
      });
    });
  });

  describe('cleanupExpired', () => {
    it('deletes expired token entries', async () => {
      mockPrisma.tokenWhitelist.deleteMany.mockResolvedValue({ count: 5 });

      const result = await appRuntime.runPromise(
        tokenWhitelistService.cleanupExpired(),
      );
      expect(result).toBe(5);
      expect(mockPrisma.tokenWhitelist.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe('countByUser', () => {
    it('returns count of active tokens for a user', async () => {
      mockPrisma.tokenWhitelist.count.mockResolvedValue(2);

      const result = await appRuntime.runPromise(
        tokenWhitelistService.countByUser(1),
      );
      expect(result).toBe(2);
      expect(mockPrisma.tokenWhitelist.count).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });
});
