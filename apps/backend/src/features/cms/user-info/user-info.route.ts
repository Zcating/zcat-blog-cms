import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { UserInfoSchema } from './user-info.schema';
import { userInfoService } from './user-info.service';

const userInfoRoutes = new Hono().basePath('/user-info');

// GET / - 获取用户信息
userInfoRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const result = await userInfoService.get(user?.userId);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: result,
      }),
    );
  } catch (error) {
    logger.error('获取用户信息失败', error);
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
      const body = c.req.valid('json');
      const result = await userInfoService.update(user?.userId, body);

      if (!result) {
        return c.json(
          createResult({
            code: ResultCode.ValidationError,
            message: 'failed',
          }),
        );
      }

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('更新用户信息失败', error);
      throw error;
    }
  },
);

export default userInfoRoutes;
