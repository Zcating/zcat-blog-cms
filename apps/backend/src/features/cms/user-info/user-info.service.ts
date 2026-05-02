import { ossService, prismaService } from '../../../services';

export class UserInfoService {
  private transformUserInfo<T extends { avatar?: string | null }>(
    userInfo: T,
  ): T {
    if (userInfo.avatar) {
      return {
        ...userInfo,
        avatar: ossService.getPrivateUrl(userInfo.avatar || ''),
      } as T;
    }
    return userInfo;
  }

  async get(userId: number | undefined) {
    if (!userId) {
      return null;
    }

    let result = await prismaService.userInfo.findUnique({
      where: { id: userId },
    });

    if (!result) {
      result = await prismaService.userInfo.create({
        data: {
          name: '',
          contact: '{}',
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
          userId,
        },
      });
    }

    return this.transformUserInfo(result);
  }

  async update(
    userId: number | undefined,
    data: {
      name?: string;
      contact?: Record<string, string>;
      occupation?: string;
      avatar?: string;
      aboutMe?: string;
      abstract?: string;
    },
  ) {
    if (!userId) {
      return null;
    }

    const updated = await prismaService.userInfo.update({
      where: { id: userId },
      data: {
        name: data.name,
        contact: JSON.stringify(data.contact),
        occupation: data.occupation,
        avatar: data.avatar,
        aboutMe: data.aboutMe,
        abstract: data.abstract,
      },
    });

    return this.transformUserInfo(updated);
  }
}

export const userInfoService = new UserInfoService();
