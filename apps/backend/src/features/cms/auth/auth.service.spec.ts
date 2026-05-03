import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../services', () => ({
  prismaService: mockPrisma,
}));

// Must be hoisted before bcrypt/jwt mocks
const mockBcrypt = vi.hoisted(() => ({
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(),
}));

vi.mock('bcrypt', () => ({ default: mockBcrypt, ...mockBcrypt }));
vi.mock('jsonwebtoken', () => ({ default: mockJwt, ...mockJwt }));

import { authService } from './auth.service';

describe('authService', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns accessToken on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        password: 'hashed-password',
        salt: 'somesalt',
      });
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockJwt.sign.mockReturnValue('token123');

      const result = await authService.login('admin', 'password');

      expect(result).toEqual({ accessToken: 'token123' });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 'somesalt');
    });

    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.login('nonexistent', 'password');

      expect(result).toBeNull();
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
    });
  });
});
