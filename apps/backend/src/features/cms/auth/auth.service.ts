import * as bcrypt from 'bcrypt';
import { Effect } from 'effect';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { config } from '../../../common/config.service';
import { PrismaService, tryPromise } from '../../../common/effect';

import { tokenWhitelistService } from './whitelist.service';

interface LoginOptions {
  device?: string;
  ip?: string;
  userAgent?: string;
}

export function login(
  username: string,
  password: string,
  options?: LoginOptions,
) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const user = yield* tryPromise(() =>
      prisma.user.findUnique({ where: { username } }),
    );

    if (!user) {
      return null;
    }

    const isPasswordValid = yield* tryPromise(() =>
      bcrypt.compare(password, user.password),
    );
    if (!isPasswordValid) {
      return null;
    }

    const token = jwt.sign(
      { username: user.username, sub: user.id, jti: randomUUID() },
      config.jwtSecret,
      { expiresIn: '1d' },
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    yield* tokenWhitelistService.create({
      token,
      userId: user.id,
      device: options?.device,
      ip: options?.ip,
      userAgent: options?.userAgent,
      expiresAt,
    });

    return { accessToken: token };
  });
}

export function register(username: string, password: string, email: string) {
  return Effect.gen(function* () {
    if (!config.allowRegister) {
      return { code: 'REGISTER_LIMIT' as const };
    }

    const prisma = yield* PrismaService;
    const users = yield* tryPromise(() => prisma.user.findMany());
    if (users.length >= 1) {
      return { code: 'REGISTER_LIMIT' as const };
    }

    const existingUser = yield* tryPromise(() =>
      prisma.user.findUnique({ where: { username } }),
    );
    if (existingUser) {
      return { code: 'USER_EXISTS' as const };
    }

    const salt = yield* tryPromise(() => bcrypt.genSalt());
    const hashedPassword = yield* tryPromise(() => bcrypt.hash(password, salt));

    const user = yield* tryPromise(() =>
      prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email,
          salt,
        },
      }),
    );

    const token = jwt.sign({ username, sub: user.id }, config.jwtSecret, {
      expiresIn: '1d',
    });

    return { code: 'SUCCESS' as const, accessToken: token };
  });
}

export function logout(token: string) {
  return Effect.gen(function* () {
    yield* tokenWhitelistService.remove(token);
  });
}

export function isValid(token: string) {
  return Effect.gen(function* () {
    try {
      jwt.verify(token, config.jwtSecret);
      return yield* tokenWhitelistService.validate(token);
    } catch {
      return false;
    }
  });
}

export const authService = { login, register, logout, isValid };
