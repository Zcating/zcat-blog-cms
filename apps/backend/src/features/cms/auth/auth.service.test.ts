import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  tokenWhitelist: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('../../../common', () => ({
  prismaService: mockPrisma,
}));

const mockBcrypt = vi.hoisted(() => ({
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(),
}));

vi.mock('bcrypt', () => ({ default: mockBcrypt, ...mockBcrypt }));
vi.mock('jsonwebtoken', () => ({ default: mockJwt, ...mockJwt }));

const whitelistMocks = vi.hoisted(() => ({
  create: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./whitelist.service', () => ({
  tokenWhitelistService: {
    create: whitelistMocks.create,
    remove: whitelistMocks.remove,
  },
}));

import { authService } from './auth.service';

describe('authService', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns accessToken and creates whitelist entry on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        password: 'hashed-password',
        salt: 'somesalt',
      });
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('token123');
      whitelistMocks.create.mockResolvedValue({ id: 1 });

      const result = await authService.login('admin', 'password', {
        device: 'Chrome',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual({ accessToken: 'token123' });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 'somesalt');
      expect(whitelistMocks.create).toHaveBeenCalledWith({
        token: 'token123',
        userId: 1,
        device: 'Chrome',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: expect.any(Date),
      });
    });

    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.login('nonexistent', 'password');

      expect(result).toBeNull();
      expect(whitelistMocks.create).not.toHaveBeenCalled();
    });

    it('returns null when password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        password: 'real-hash',
        salt: 'salt',
      });
      mockBcrypt.hash.mockResolvedValue('wrong-hash');

      const result = await authService.login('admin', 'wrong');

      expect(result).toBeNull();
      expect(whitelistMocks.create).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('returns REGISTER_LIMIT when a user already exists', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await authService.register('user', 'pass', 'e@m.com');

      expect(result).toEqual({ code: 'REGISTER_LIMIT' });
    });

    it('returns USER_EXISTS when username is taken', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await authService.register('taken', 'pass', 'e@m.com');

      expect(result).toEqual({ code: 'USER_EXISTS' });
    });

    it('creates user and returns token on successful registration', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('newsalt');
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockJwt.sign.mockReturnValue('reg-token');
      mockPrisma.user.create.mockResolvedValue({ id: 99, username: 'newuser' });

      const result = await authService.register('newuser', 'pass', 'e@m.com');

      expect(result).toEqual({
        code: 'SUCCESS',
        accessToken: 'reg-token',
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          password: 'hashed',
          email: 'e@m.com',
          salt: 'newsalt',
        },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { username: 'newuser', sub: 99 },
        'test-secret',
        { expiresIn: '1d' },
      );
    });
  });

  describe('logout', () => {
    it('removes token from whitelist', async () => {
      whitelistMocks.remove.mockResolvedValue(undefined);

      await authService.logout('test-token');

      expect(whitelistMocks.remove).toHaveBeenCalledWith('test-token');
    });
  });
});
