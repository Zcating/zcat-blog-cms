import { zValidator } from '@hono/zod-validator';
import * as bcrypt from 'bcrypt';
import { Hono } from 'hono';
import jwt from 'jsonwebtoken';

import { createResult, ResultCode } from '@backend/model';

import { prismaService } from '../../../services';

import { loginSchema, registerDtoSchema } from './auth.schema';

const authRoutes = new Hono().basePath('/api/auth');

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  try {
    const user = await prismaService.user.findUnique({
      where: { username },
    });

    if (!user) {
      return c.json(
        createResult({
          code: ResultCode.LoginError,
          message: '用户名或密码错误',
        }),
      );
    }

    const hashPassword = await bcrypt.hash(password, user.salt);
    if (user.password !== hashPassword) {
      return c.json(
        createResult({
          code: ResultCode.LoginError,
          message: '用户名或密码错误',
        }),
      );
    }

    const token = jwt.sign(
      { username: user.username, sub: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' },
    );

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '登录成功',
        data: { accessToken: token },
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
      const users = await prismaService.user.findMany();
      if (users.length >= 1) {
        return c.json(
          createResult({
            code: ResultCode.RegisterError,
            message: '注册失败',
          }),
        );
      }

      const existingUser = await prismaService.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return c.json(
          createResult({
            code: ResultCode.RegisterError,
            message: '用户已存在',
          }),
        );
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const createdUser = await prismaService.user.create({
        data: {
          username,
          password: hashedPassword,
          email,
          salt,
        },
      });

      const token = jwt.sign(
        { username: createdUser.username, sub: createdUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' },
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '注册成功',
          data: { accessToken: token },
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
