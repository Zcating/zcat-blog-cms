import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@backend/table';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { createResult } from '@backend/model';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.userRepository.findOne({
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
        code: 'ERR0002',
        message: '用户名或密码错误',
      });
    }

    return createResult({
      code: '0000',
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
    const existingUser = await this.userRepository.findOneBy({
      username: registerDto.username,
    });
    if (existingUser) {
      return createResult({
        code: 'ERR0001',
        message: '用户已存在',
      });
    }

    // 密码加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 创建新用户
    const createdUser = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      email: registerDto.email,
      salt,
    });
    // 提交操作
    const savedUser = await this.userRepository.save(createdUser);

    // 返回JWT令牌
    return createResult({
      code: '0000',
      message: '注册成功',
      data: {
        accessToken: this.jwtService.sign({
          username: savedUser.username,
          sub: savedUser.id,
        }),
      },
    });
  }
}
