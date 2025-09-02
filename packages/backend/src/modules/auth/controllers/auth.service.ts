import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { createResult, ResultCode } from '@backend/model';
import { PrismaService } from '@backend/prisma.service';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      return null;
    }
    const hashPassword = await bcrypt.hash(pass, user.salt);
    if (user.password !== hashPassword) {
      return null;
    }
    return user;
  }

  async login(loginDto: { username: string; password: string }) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      return createResult({
        code: ResultCode.LoginError,
        message: '用户名或密码错误',
      });
    }

    return createResult({
      code: ResultCode.Success,
      message: '登录成功',
      data: {
        accessToken: this.jwtService.sign({
          username: user.username,
          sub: user.id,
        }),
      },
    });
  }

  async register(registerDto: {
    username: string;
    password: string;
    email: string;
  }) {
    // console.log(bcrypt);
    // return {
    //   accessToken: '',
    // };
    // 检查用户名是否已存在
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        username: registerDto.username,
      },
    });
    if (existingUser) {
      return createResult({
        code: ResultCode.RegisterError,
        message: '用户已存在',
      });
    }

    // 密码加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 创建新用户
    const createdUser = await this.prismaService.user.create({
      data: {
        username: registerDto.username,
        password: hashedPassword,
        email: registerDto.email,
        salt,
      },
    });

    // 返回JWT令牌
    return createResult({
      code: ResultCode.Success,
      message: '注册成功',
      data: {
        accessToken: this.jwtService.sign({
          username: createdUser.username,
          sub: createdUser.id,
        }),
      },
    });
  }
}
