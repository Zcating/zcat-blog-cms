import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@backend/table';

import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  validateUser(username: string, pass: string) {
    return this.userRepository.findOne({
      where: { username, password: pass },
    });
  }

  login(user: User) {
    return {
      access_token: this.jwtService.sign({
        username: user.username,
        userId: user.id,
      }),
    };
  }

  async register(registerDto: {
    username: string;
    password: string;
    email: string;
  }) {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOneBy({
      username: registerDto.username,
    });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 密码加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 创建新用户
    const newUser = new User();
    newUser.username = registerDto.username;
    newUser.password = hashedPassword;
    newUser.email = registerDto.email;

    const createdUser = this.userRepository.create(newUser);

    // 返回JWT令牌
    return {
      access_token: this.jwtService.sign({
        username: createdUser.username,
        sub: createdUser.id,
      }),
    };
  }
}
