import { Effect } from 'effect';

import { OssService, PrismaService, tryPromise } from '../../../common/effect';

function transformUserInfo<T extends { avatar?: string | null }>(
  oss: { getPrivateUrl: (url: string) => string },
  userInfo: T,
): T {
  if (userInfo.avatar) {
    return {
      ...userInfo,
      avatar: oss.getPrivateUrl(userInfo.avatar || ''),
    } as T;
  }
  return userInfo;
}

export function get(userId: number | undefined) {
  return Effect.gen(function* () {
    if (!userId) {
      return null;
    }

    const prisma = yield* PrismaService;
    let result = yield* tryPromise(() =>
      prisma.userInfo.findUnique({ where: { id: userId } }),
    );

    if (!result) {
      result = yield* tryPromise(() =>
        prisma.userInfo.create({
          data: {
            name: '',
            contact: '{}',
            occupation: '',
            avatar: '',
            aboutMe: '',
            abstract: '',
            userId,
          },
        }),
      );
    }

    const oss = yield* OssService;
    return transformUserInfo(oss, result);
  });
}

export function update(
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
  return Effect.gen(function* () {
    if (!userId) {
      return null;
    }

    const prisma = yield* PrismaService;
    const updated = yield* tryPromise(() =>
      prisma.userInfo.update({
        where: { id: userId },
        data: {
          name: data.name,
          contact: JSON.stringify(data.contact),
          occupation: data.occupation,
          avatar: data.avatar,
          aboutMe: data.aboutMe,
          abstract: data.abstract,
        },
      }),
    );

    const oss = yield* OssService;
    return transformUserInfo(oss, updated);
  });
}

export const userInfoService = { get, update };
