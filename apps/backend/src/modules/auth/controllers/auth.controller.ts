import { Controller, Post, Body, Logger } from '@nestjs/common';

import { LoginDto, RegisterDto } from '../schemas/auth.schema';

import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`开始登录用户: ${loginDto.username}`);

    const result = await this.authService.login(loginDto);

    this.logger.log(`用户 ${loginDto.username} 登录成功`);

    return result;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`开始注册用户: ${registerDto.username}`);

    const result = await this.authService.register(registerDto);

    this.logger.log(`用户 ${registerDto.username} 注册成功`);

    return result;
  }
}
