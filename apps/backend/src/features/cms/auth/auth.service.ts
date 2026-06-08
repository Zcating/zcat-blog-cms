import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prismaService } from '../../../common';
import { config } from '../../../common/config.service';

import { tokenWhitelistService } from './whitelist.service';

interface LoginOptions {
  device?: string;
  ip?: string;
  userAgent?: string;
}

export async function login(
  username: string,
  password: string,
  options?: LoginOptions,
) {
  const user = await prismaService.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  const token = jwt.sign(
    { username: user.username, sub: user.id },
    config.jwtSecret,
    { expiresIn: '1d' },
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await tokenWhitelistService.create({
    token,
    userId: user.id,
    device: options?.device,
    ip: options?.ip,
    userAgent: options?.userAgent,
    expiresAt,
  });

  return { accessToken: token };
}

export async function register(
  username: string,
  password: string,
  email: string,
) {
  if (!config.allowRegister) {
    return { code: 'REGISTER_LIMIT' as const };
  }

  const users = await prismaService.user.findMany();
  if (users.length >= 1) {
    return { code: 'REGISTER_LIMIT' as const };
  }

  const existingUser = await prismaService.user.findUnique({
    where: { username },
  });
  if (existingUser) {
    return { code: 'USER_EXISTS' as const };
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prismaService.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
      salt,
    },
  });

  const token = jwt.sign({ username, sub: user.id }, config.jwtSecret, {
    expiresIn: '1d',
  });

  return { code: 'SUCCESS' as const, accessToken: token };
}

export async function logout(token: string) {
  await tokenWhitelistService.remove(token);
}

export async function isValid(token: string): Promise<boolean> {
  try {
    jwt.verify(token, config.jwtSecret);
    return await tokenWhitelistService.validate(token);
  } catch {
    return false;
  }
}

export const authService = { login, register, logout, isValid };
