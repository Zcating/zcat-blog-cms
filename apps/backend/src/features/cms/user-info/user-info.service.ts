import { ossService, prismaService } from '../../../services';

function transformUserInfo<T extends { avatar?: string | null }>(
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

export async function get(userId: number | undefined) {
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

  return transformUserInfo(result);
}

export async function update(
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

  return transformUserInfo(updated);
}

export const userInfoService = { get, update };
