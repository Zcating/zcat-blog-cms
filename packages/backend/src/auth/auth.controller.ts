import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type LoginDto = {
  username: string;
  password: string;
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
}
