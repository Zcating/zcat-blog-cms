import { Effect } from 'effect';

import { OssService, PrismaService, tryPromise } from '../../../common/effect';

import { UserInfoResponseDtoSchema } from './user-info.schema';

type UserInfoRow = {
  id: number;
  name: string;
  contact: string | null;
  occupation: string | null;
  avatar: string | null;
  aboutMe: string | null;
  abstract: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number | null;
};

function transformUserInfo(oss: OssService, userInfo: UserInfoRow) {
  return tryPromise(async () => {
    const signedAvatar = userInfo.avatar
      ? await oss.presignDownloadUrl(userInfo.avatar)
      : '';
    return UserInfoResponseDtoSchema.parse({ ...userInfo, signedAvatar });
  });
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
    return yield* transformUserInfo(oss, result);
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
    return yield* transformUserInfo(oss, updated);
  });
}

export const userInfoService = { get, update };
