import { Controller, Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';

type LoginDto = {
  username: string;
  password: string;
};

type RegisterDto = {
  username: string;
  password: string;
  email: string;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
