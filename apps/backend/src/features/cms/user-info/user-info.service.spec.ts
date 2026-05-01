import {
  createDate,
  createOssServiceMock,
  createPrismaServiceMock,
} from '../test-helpers/service-test-helper';

import { UserInfoService } from './user-info.service';

describe('UserInfoService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let ossService: ReturnType<typeof createOssServiceMock>;
  let service: UserInfoService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    ossService = createOssServiceMock();
    service = new UserInfoService(prismaService as any, ossService as any);
  });

  it('getUserInfo returns null when userId is missing', async () => {
    const result = await service.getUserInfo();

    expect(result).toBeNull();
    expect(prismaService.userInfo.findUnique).not.toHaveBeenCalled();
  });

  it('getUserInfo creates default user info when record does not exist', async () => {
    const now = createDate('2026-05-01T00:00:00.000Z');
    prismaService.userInfo.findUnique.mockResolvedValue(null);
    prismaService.userInfo.create.mockResolvedValue({
      id: 3,
      userId: 3,
      name: '',
      contact: '{}',
      occupation: '',
      avatar: '',
      aboutMe: '',
      abstract: '',
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.getUserInfo(3);

    expect(prismaService.userInfo.create).toHaveBeenCalledWith({
      data: {
        name: '',
        contact: '{}',
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
        userId: 3,
      },
    });
    expect(result).toEqual({
      id: 3,
      userId: 3,
      name: '',
      contact: '{}',
      occupation: '',
      avatar: '',
      aboutMe: '',
      abstract: '',
      createdAt: now,
      updatedAt: now,
    });
    expect(ossService.getPrivateUrl).not.toHaveBeenCalled();
  });

  it('getUserInfo transforms avatar to private url when avatar exists', async () => {
    const now = createDate('2026-05-02T00:00:00.000Z');
    prismaService.userInfo.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      name: 'owner',
      contact: '{}',
      occupation: 'dev',
      avatar: 'avatar.jpg',
      aboutMe: 'about',
      abstract: 'abstract',
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.getUserInfo(1);

    expect(ossService.getPrivateUrl).toHaveBeenCalledWith('avatar.jpg');
    expect(result?.avatar).toBe('private://avatar.jpg');
  });

  it('updateUserInfo serializes contact and transforms avatar url', async () => {
    const now = createDate('2026-05-03T00:00:00.000Z');

    prismaService.userInfo.update.mockResolvedValue({
      id: 5,
      userId: 5,
      name: 'new-name',
      contact: '{"email":"new@example.com","github":"new-gh"}',
      occupation: 'engineer',
      avatar: 'new-avatar.png',
      aboutMe: 'about me',
      abstract: 'summary',
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.updateUserInfo(5, {
      name: 'new-name',
      contact: {
        email: 'new@example.com',
        github: 'new-gh',
      },
      occupation: 'engineer',
      avatar: 'new-avatar.png',
      aboutMe: 'about me',
      abstract: 'summary',
    } as any);

    expect(prismaService.userInfo.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        name: 'new-name',
        contact: JSON.stringify({
          email: 'new@example.com',
          github: 'new-gh',
        }),
        occupation: 'engineer',
        avatar: 'new-avatar.png',
        aboutMe: 'about me',
        abstract: 'summary',
      },
    });
    expect(ossService.getPrivateUrl).toHaveBeenCalledWith('new-avatar.png');
    expect(result.avatar).toBe('private://new-avatar.png');
  });
});
