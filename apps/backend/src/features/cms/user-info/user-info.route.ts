import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';

import { prismaService, ossService } from '../../../services';

import { UserInfoSchema } from './user-info.schema';

const userInfoRoutes = new Hono().basePath('/api/cms/user-info');

/**
 * 转换用户信息（私有URL处理）
 */
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

// GET / - 获取用户信息
userInfoRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const userId = user?.userId;

    if (!userId) {
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: null,
        }),
      );
    }

    console.log(`获取用户信息，用户ID: ${userId}`);

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
          userId: userId,
        },
      });
    }

    const transformed = transformUserInfo(result);

    console.log(`用户信息获取成功，用户ID: ${userId}`);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: transformed,
      }),
    );
  } catch (error) {
    console.error('获取用户信息失败', error);
    throw error;
  }
});

// POST /update - 更新用户信息
userInfoRoutes.post(
  '/update',
  zValidator('json', UserInfoSchema),
  async (c) => {
    try {
      const user = c.get('user');
      const userId = user?.userId;
      const body = c.req.valid('json');

      if (!userId) {
        return c.json(
          createResult({
            code: ResultCode.ValidationError,
            message: 'failed',
          }),
        );
      }

      console.log(`更新用户信息，用户ID: ${userId}`);

      const updated = await prismaService.userInfo.update({
        where: { id: userId },
        data: {
          name: body.name,
          contact: JSON.stringify(body.contact),
          occupation: body.occupation,
          avatar: body.avatar,
          aboutMe: body.aboutMe,
          abstract: body.abstract,
        },
      });

      const transformed = transformUserInfo(updated);

      console.log(`用户信息更新成功，用户ID: ${userId}`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: transformed,
        }),
      );
    } catch (error) {
      console.error('更新用户信息失败', error);
      throw error;
    }
  },
);

export default userInfoRoutes;
