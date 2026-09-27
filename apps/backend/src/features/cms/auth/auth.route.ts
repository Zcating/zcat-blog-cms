import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { appRuntime } from '@backend/common/effect';
import { createResult, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { loginSchema, registerDtoSchema } from './auth.schema';
import { authService } from './auth.service';

const authRoutes = new Hono();

// Effect 的 FiberFailure 会把底层错误包进 name（如 "(FiberFailure) PrismaClientKnownRequestError"），
// 且只暴露 stack/message/name —— 既没有 code，也没有可枚举的 cause。所以 `code === 'P2002'` 与
// `instanceof Prisma.PrismaClientKnownRequestError` 都无法命中，改成 instanceof 会静默丢掉这个前缀。
// 子串匹配同时覆盖完全没有 code 的 PrismaClientInitializationError（数据库不可达）。
function isDatabaseFailure(error: unknown): boolean {
  return error instanceof Error && error.name.includes('PrismaClient');
}

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const device = c.req.header('User-Agent');
  const ip = c.req.header('X-Forwarded-For') ?? c.req.header('X-Real-IP');
  const userAgent = c.req.header('User-Agent');

  try {
    const result = await appRuntime.runPromise(
      authService.login(username, password, {
        device,
        ip,
        userAgent,
      }),
    );

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
    const databaseFailure = isDatabaseFailure(error);
    return c.json(
      createResult({
        code: databaseFailure
          ? ResultCode.DatabaseError
          : ResultCode.UnknownError,
        message: databaseFailure ? '数据库操作失败' : '登录服务异常',
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
        message: 'success',
        data: { valid: false as boolean },
      }),
    );
  }

  const token = authHeader.slice(7);
  try {
    const valid = await appRuntime.runPromise(authService.isValid(token));

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
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
    await appRuntime.runPromise(authService.logout(token));
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
      const result = await appRuntime.runPromise(
        authService.register(username, password, email),
      );

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
