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
  presignDownloadUrl: vi.fn(
    async (key: string) => `https://signed.example/${key}`,
  ),
  deleteFile: vi.fn(),
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

import { userInfoService } from './user-info.service';

const userInfoRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'User',
  contact: '{}',
  occupation: 'Dev',
  avatar: 'avatar.jpg',
  aboutMe: 'About',
  abstract: 'Abstract',
  userId: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('userInfoService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns null when userId is not provided', async () => {
      const result = await appRuntime.runPromise(
        userInfoService.get(undefined),
      );

      expect(result).toBeNull();
    });

    it('returns existing user info', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfoRow());

      const result = await appRuntime.runPromise(userInfoService.get(1));

      expect(result).toBeDefined();
      expect(result!.avatar).toBe('avatar.jpg');
    });

    it('keeps the bare object key and adds a presigned avatar address next to it', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ avatar: 'user/avatar.jpg' }),
      );

      const result = await appRuntime.runPromise(userInfoService.get(1));

      expect(result!.avatar).toBe('user/avatar.jpg');
      expect(result!.signedAvatar).toBe(
        'https://signed.example/user/avatar.jpg',
      );
      expect(mockOssService.presignDownloadUrl).toHaveBeenCalledWith(
        'user/avatar.jpg',
      );
    });

    it('leaves signedAvatar empty when there is no avatar to sign', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ avatar: null }),
      );

      const result = await appRuntime.runPromise(userInfoService.get(1));

      expect(result!.signedAvatar).toBe('');
      expect(mockOssService.presignDownloadUrl).not.toHaveBeenCalled();
    });

    it('does not leak fields the user info DTO does not declare', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ leakedInternalColumn: 'secret' }),
      );

      const result = await appRuntime.runPromise(userInfoService.get(1));

      expect(result).not.toHaveProperty('leakedInternalColumn');
    });

    it('fails the read when the avatar address cannot be signed', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfoRow());
      mockOssService.presignDownloadUrl.mockRejectedValueOnce(
        new Error('signing unavailable'),
      );

      await expect(
        appRuntime.runPromise(userInfoService.get(1)),
      ).rejects.toThrow('signing unavailable');
    });

    it('creates user info if not found', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(null);
      mockPrisma.userInfo.create.mockResolvedValue(userInfoRow({ name: '' }));

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
      mockPrisma.userInfo.findUnique.mockResolvedValue(
        userInfoRow({ avatar: null }),
      );

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
      mockPrisma.userInfo.update.mockResolvedValue(
        userInfoRow({ name: 'Updated', contact: '{}' }),
      );

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
      mockPrisma.userInfo.update.mockResolvedValue(
        userInfoRow({ name: 'Updated', contact: '{}' }),
      );

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
      mockPrisma.userInfo.update.mockResolvedValue(
        userInfoRow({
          name: 'Full',
          contact: JSON.stringify({ email: 'a@b.com', github: 'u' }),
          occupation: 'Dev',
          avatar: 'avatar.jpg',
          aboutMe: 'About me',
          abstract: 'Abs',
        }),
      );

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

    it('returns a presigned avatar for the key that was just saved', async () => {
      mockPrisma.userInfo.update.mockResolvedValue(
        userInfoRow({ avatar: 'user/new-avatar.jpg' }),
      );

      const result = await appRuntime.runPromise(
        userInfoService.update(1, { avatar: 'user/new-avatar.jpg' }),
      );

      expect(result!.avatar).toBe('user/new-avatar.jpg');
      expect(result!.signedAvatar).toBe(
        'https://signed.example/user/new-avatar.jpg',
      );
    });
  });
});
