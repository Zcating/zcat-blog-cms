import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';

import { loginSchema, registerDtoSchema } from './auth.schema';
import { authService } from './auth.service';

const authRoutes = new Hono().basePath('/api/auth');

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  try {
    const result = await authService.login(username, password);

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
    console.error('Login error:', error);
    return c.json(
      createResult({
        code: ResultCode.UnknownError,
        message: '登录失败',
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
      console.error('Register error:', error);
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
