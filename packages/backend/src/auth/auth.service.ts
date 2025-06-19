import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type User = {
  userId: string;
  username: string;
  password: string;
};

interface UserInfo {
  userId: string;
  username: string;
}

@Injectable()
export class AuthService {
  private readonly users: User[] = [
    {
      userId: '1',
      username: 'admin',
      password: 'admin',
    },
  ];

  constructor(private jwtService: JwtService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async validateUser(username: string, pass: string): Promise<UserInfo | null> {
    const user = this.users.find(
      (user) => user.username === username && user.password === pass,
    );
    if (!user) {
      return null;
    }
    return {
      userId: user.userId,
      username: user.username,
    };
  }

  login(user: UserInfo) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
