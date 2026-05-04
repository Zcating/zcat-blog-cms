import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prismaService } from '../../../common';

export async function login(username: string, password: string) {
  const user = await prismaService.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  const hashPassword = await bcrypt.hash(password, user.salt);
  if (user.password !== hashPassword) {
    return null;
  }

  const token = jwt.sign(
    { username: user.username, sub: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' },
  );

  return { accessToken: token };
}

export async function register(
  username: string,
  password: string,
  email: string,
) {
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

  await prismaService.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
      salt,
    },
  });

  const token = jwt.sign(
    { username, sub: undefined },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' },
  );

  return { code: 'SUCCESS' as const, accessToken: token };
}

export const authService = { login, register };
