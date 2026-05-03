import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  userInfo: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const mockOssService = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => `private-${url}`),
}));

vi.mock('../../../services', () => ({
  prismaService: mockPrisma,
  ossService: mockOssService,
}));

import { userInfoService } from './user-info.service';

describe('userInfoService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns null when userId is not provided', async () => {
      const result = await userInfoService.get(undefined);

      expect(result).toBeNull();
    });

    it('returns existing user info', async () => {
      const userInfo = {
        id: 1,
        name: 'User',
        contact: '{}',
        occupation: 'Dev',
        avatar: 'avatar.jpg',
        aboutMe: 'About',
        abstract: 'Abstract',
        userId: 1,
      };
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfo);

      const result = await userInfoService.get(1);

      expect(result).toBeDefined();
      expect(result!.avatar).toBe('private-avatar.jpg');
    });

    it('creates user info if not found', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(null);
      mockPrisma.userInfo.create.mockResolvedValue({
        id: 1,
        name: '',
        contact: '{}',
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
        userId: 1,
      });

      const result = await userInfoService.get(1);

      expect(result).toBeDefined();
      expect(mockPrisma.userInfo.create).toHaveBeenCalledWith({
        data: {
          name: '',
          contact: '{}',
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
          userId: 1,
        },
      });
    });
  });

  describe('update', () => {
    it('returns null when userId is not provided', async () => {
      const result = await userInfoService.update(undefined, {
        name: 'Test',
      });

      expect(result).toBeNull();
    });

    it('updates user info', async () => {
      const updated = {
        id: 1,
        name: 'Updated',
        contact: '{}',
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
        userId: 1,
      };
      mockPrisma.userInfo.update.mockResolvedValue(updated);

      const result = await userInfoService.update(1, {
        name: 'Updated',
        contact: {},
      });

      expect(result).toBeDefined();
      expect(mockPrisma.userInfo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated',
          contact: '{}',
          occupation: undefined,
          avatar: undefined,
          aboutMe: undefined,
          abstract: undefined,
        },
      });
    });
  });
});
