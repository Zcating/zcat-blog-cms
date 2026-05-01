import * as bcrypt from 'bcrypt';

import { ResultCode } from '@backend/model';

import {
  createJwtServiceMock,
  createPrismaServiceMock,
} from '../test-helpers/service-test-helper';

import { AuthService } from './auth.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

describe('AuthService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let jwtService: ReturnType<typeof createJwtServiceMock>;
  let service: AuthService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    jwtService = createJwtServiceMock();
    service = new AuthService(prismaService as any, jwtService as any);
    vi.clearAllMocks();
  });

  it('validateUser returns null when user is missing', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    const result = await service.validateUser('admin', 'secret');

    expect(result).toBeNull();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('validateUser returns null when password does not match', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      password: 'stored-hash',
      salt: 'salt-a',
    });
    vi.mocked(bcrypt.hash).mockImplementation(async () => 'new-hash');

    const result = await service.validateUser('admin', 'secret');

    expect(result).toBeNull();
  });

  it('validateUser returns user when password matches', async () => {
    const user = {
      id: 2,
      username: 'owner',
      password: 'same-hash',
      salt: 'salt-b',
    };

    prismaService.user.findUnique.mockResolvedValue(user);
    vi.mocked(bcrypt.hash).mockImplementation(async () => 'same-hash');

    const result = await service.validateUser('owner', 'password');

    expect(result).toEqual(user);
  });

  it('login returns LoginError when credentials are invalid', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    const result = await service.login({ username: 'none', password: 'none' });

    expect(result).toEqual({
      code: ResultCode.LoginError,
      message: '用户名或密码错误',
      data: undefined,
    });
  });

  it('login returns access token when credentials are valid', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 9,
      username: 'admin',
      password: 'hash-ok',
      salt: 'salt-c',
    });
    vi.mocked(bcrypt.hash).mockImplementation(async () => 'hash-ok');
    jwtService.sign.mockReturnValue('token-login');

    const result = await service.login({
      username: 'admin',
      password: '123456',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({ username: 'admin', sub: 9 });
    expect(result).toEqual({
      code: ResultCode.Success,
      message: '登录成功',
      data: {
        accessToken: 'token-login',
      },
    });
  });

  it('register returns RegisterError when there is already a user record', async () => {
    prismaService.user.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.register({
      username: 'admin',
      password: 'secret',
      email: 'admin@example.com',
    });

    expect(result).toEqual({
      code: ResultCode.RegisterError,
      message: '注册失败',
      data: undefined,
    });
    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('register returns RegisterError when username already exists', async () => {
    prismaService.user.findMany.mockResolvedValue([]);
    prismaService.user.findUnique.mockResolvedValue({
      id: 7,
      username: 'admin',
    });

    const result = await service.register({
      username: 'admin',
      password: 'secret',
      email: 'admin@example.com',
    });

    expect(result).toEqual({
      code: ResultCode.RegisterError,
      message: '用户已存在',
      data: undefined,
    });
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('register creates user and returns token when input is valid', async () => {
    prismaService.user.findMany.mockResolvedValue([]);
    prismaService.user.findUnique.mockResolvedValue(null);
    vi.mocked(bcrypt.genSalt).mockImplementation(async () => 'salt-d');
    vi.mocked(bcrypt.hash).mockImplementation(async () => 'hashed-pass');
    prismaService.user.create.mockResolvedValue({
      id: 99,
      username: 'new-user',
    });
    jwtService.sign.mockReturnValue('token-register');

    const result = await service.register({
      username: 'new-user',
      password: 'new-pass',
      email: 'new@example.com',
    });

    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        username: 'new-user',
        password: 'hashed-pass',
        email: 'new@example.com',
        salt: 'salt-d',
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: 'new-user',
      sub: 99,
    });
    expect(result).toEqual({
      code: ResultCode.Success,
      message: '注册成功',
      data: {
        accessToken: 'token-register',
      },
    });
  });
});
