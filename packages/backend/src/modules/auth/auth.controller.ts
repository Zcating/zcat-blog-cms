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
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
