import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { loginSchema, registerDtoSchema } from './auth.schema';
import { authService } from './auth.service';

const authRoutes = new Hono();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const device = c.req.header('User-Agent');
  const ip = c.req.header('X-Forwarded-For') ?? c.req.header('X-Real-IP');
  const userAgent = c.req.header('User-Agent');

  try {
    const result = await authService.login(username, password, {
      device,
      ip,
      userAgent,
    });

    if (!result) {
      return c.json(
        createResult({
          code: ResultCode.LoginError,
          message: '用户名或密码错误',
        }),
      );
    }

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '登录成功',
        data: result,
      }),
    );
  } catch (error) {
    logger.error('Login error:', error);
    return c.json(
      createResult({
        code: ResultCode.UnknownError,
        message: '登录失败',
      }),
    );
  }
});

authRoutes.post('/is-valid', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      createResult({
        code: ResultCode.Success,
        data: { valid: false },
      }),
    );
  }

  const token = authHeader.slice(7);
  try {
    const valid = await authService.isValid(token);

    return c.json(
      createResult({
        code: ResultCode.Success,
        data: { valid },
      }),
    );
  } catch (error) {
    logger.error('Is valid error:', error);
    return c.json(
      createResult({
        code: ResultCode.UnknownError,
        message: '校验失败',
      }),
    );
  }
});

authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '已登出',
      }),
    );
  }

  const token = authHeader.slice(7);
  try {
    await authService.logout(token);
    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '登出成功',
      }),
    );
  } catch (error) {
    logger.error('Logout error:', error);
    return c.json(
      createResult({
        code: ResultCode.UnknownError,
        message: '登出失败',
      }),
    );
  }
});

authRoutes.post(
  '/register',
  zValidator('json', registerDtoSchema),
  async (c) => {
    const { username, password, email } = c.req.valid('json');

    try {
      const result = await authService.register(username, password, email);

      if (result.code === 'REGISTER_LIMIT') {
        return c.json(
          createResult({
            code: ResultCode.RegisterError,
            message: '注册失败',
          }),
        );
      }

      if (result.code === 'USER_EXISTS') {
        return c.json(
          createResult({
            code: ResultCode.RegisterError,
            message: '用户已存在',
          }),
        );
      }

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '注册成功',
          data: { accessToken: result.accessToken },
        }),
      );
    } catch (error) {
      logger.error('Register error:', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '注册失败',
        }),
      );
    }
  },
);

export default authRoutes;
