import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

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

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

import { userInfoService } from './user-info.service';

describe('userInfoService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns null when userId is not provided', async () => {
      const result = await appRuntime.runPromise(userInfoService.get(undefined));

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

      const result = await appRuntime.runPromise(userInfoService.get(1));

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

      const result = await appRuntime.runPromise(userInfoService.get(1));

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

    it('returns existing user info without avatar unchanged', async () => {
      const userInfo = {
        id: 1,
        name: 'User',
        contact: '{}',
        occupation: 'Dev',
        avatar: null,
        aboutMe: 'About',
        abstract: 'Abstract',
        userId: 1,
      };
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfo);

      const result = await appRuntime.runPromise(userInfoService.get(1));

      expect(result).toBeDefined();
      expect(result!.avatar).toBeNull();
    });
  });

  describe('update', () => {
    it('returns null when userId is not provided', async () => {
      const result = await appRuntime.runPromise(
        userInfoService.update(undefined, { name: 'Test' }),
      );

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

      const result = await appRuntime.runPromise(
        userInfoService.update(1, {
          name: 'Updated',
          contact: {},
        }),
      );

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

    it('update partial fields skips undefined contact', async () => {
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

      const result = await appRuntime.runPromise(
        userInfoService.update(1, {
          name: 'Updated',
        }),
      );

      expect(result).toBeDefined();
      expect(mockPrisma.userInfo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated',
          contact: undefined,
          occupation: undefined,
          avatar: undefined,
          aboutMe: undefined,
          abstract: undefined,
        },
      });
    });

    it('update all fields serializes correctly', async () => {
      const updated = {
        id: 1,
        name: 'Full',
        contact: JSON.stringify({ email: 'a@b.com', github: 'u' }),
        occupation: 'Dev',
        avatar: 'avatar.jpg',
        aboutMe: 'About me',
        abstract: 'Abs',
        userId: 1,
      };
      mockPrisma.userInfo.update.mockResolvedValue(updated);

      const result = await appRuntime.runPromise(
        userInfoService.update(1, {
          name: 'Full',
          contact: { email: 'a@b.com', github: 'u' },
          occupation: 'Dev',
          avatar: 'avatar.jpg',
          aboutMe: 'About me',
          abstract: 'Abs',
        }),
      );

      expect(result).toBeDefined();
      expect(result!.name).toBe('Full');
      expect(result!.occupation).toBe('Dev');
      expect(mockPrisma.userInfo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Full',
          contact: JSON.stringify({ email: 'a@b.com', github: 'u' }),
          occupation: 'Dev',
          avatar: 'avatar.jpg',
          aboutMe: 'About me',
          abstract: 'Abs',
        },
      });
    });
  });
});