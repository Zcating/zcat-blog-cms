import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

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

// Mock the singleton files so the Effect tags pick up the mocks
// and the real MinIO client is not loaded.
vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: { getPrivateUrl: vi.fn(), presignUploadUrl: vi.fn(), deleteFile: vi.fn() },
}));

vi.mock('../../../common/config.service', () => ({
  config: { jwtSecret: 'test-secret', allowRegister: true },
}));

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('bcrypt', () => ({ default: mockBcrypt, ...mockBcrypt }));
vi.mock('jsonwebtoken', () => ({ default: mockJwt, ...mockJwt }));

const whitelistMocks = vi.hoisted(() => ({
  create: vi.fn(),
  validate: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./whitelist.service', () => ({
  tokenWhitelistService: {
    create: whitelistMocks.create,
    validate: whitelistMocks.validate,
    remove: whitelistMocks.remove,
  },
}));

import { appRuntime } from '@backend/common/effect';
import { authService } from './auth.service';

describe('authService', () => {
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
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token123');
      whitelistMocks.create.mockReturnValue(Effect.succeed({ id: 1 }));

      const result = await appRuntime.runPromise(
        authService.login('admin', 'password', {
          device: 'Chrome',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      );

      expect(result).toEqual({ accessToken: 'token123' });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
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

      const result = await appRuntime.runPromise(
        authService.login('nonexistent', 'password'),
      );

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
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await appRuntime.runPromise(
        authService.login('admin', 'wrong'),
      );

      expect(result).toBeNull();
      expect(whitelistMocks.create).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('returns REGISTER_LIMIT when allowRegister config is false', async () => {
      vi.doMock('../../../common/config.service', () => ({
        config: { jwtSecret: 'test-secret', allowRegister: false },
      }));
      vi.resetModules();
      const { authService: freshAuthService } = await import('./auth.service');

      const result = await appRuntime.runPromise(
        freshAuthService.register('user', 'pass', 'e@m.com'),
      );

      expect(result).toEqual({ code: 'REGISTER_LIMIT' });
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns REGISTER_LIMIT when a user already exists', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await appRuntime.runPromise(
        authService.register('user', 'pass', 'e@m.com'),
      );

      expect(result).toEqual({ code: 'REGISTER_LIMIT' });
    });

    it('returns USER_EXISTS when username is taken', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await appRuntime.runPromise(
        authService.register('taken', 'pass', 'e@m.com'),
      );

      expect(result).toEqual({ code: 'USER_EXISTS' });
    });

    it('creates user and returns token on successful registration', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('newsalt');
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockJwt.sign.mockReturnValue('reg-token');
      mockPrisma.user.create.mockResolvedValue({ id: 99, username: 'newuser' });

      const result = await appRuntime.runPromise(
        authService.register('newuser', 'pass', 'e@m.com'),
      );

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
      whitelistMocks.remove.mockReturnValue(Effect.succeed(undefined));

      await appRuntime.runPromise(authService.logout('test-token'));

      expect(whitelistMocks.remove).toHaveBeenCalledWith('test-token');
    });
  });

  describe('isValid', () => {
    it('returns true when jwt is valid and token exists in whitelist', async () => {
      mockJwt.verify.mockReturnValue({ sub: 1 });
      whitelistMocks.validate.mockReturnValue(Effect.succeed(true));

      const result = await appRuntime.runPromise(
        authService.isValid('valid-token'),
      );

      expect(result).toBe(true);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(whitelistMocks.validate).toHaveBeenCalledWith('valid-token');
    });

    it('returns false when token is not in whitelist', async () => {
      mockJwt.verify.mockReturnValue({ sub: 1 });
      whitelistMocks.validate.mockReturnValue(Effect.succeed(false));

      const result = await appRuntime.runPromise(
        authService.isValid('missing-token'),
      );

      expect(result).toBe(false);
    });

    it('returns false when jwt verification throws', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await appRuntime.runPromise(
        authService.isValid('invalid-token'),
      );

      expect(result).toBe(false);
      expect(whitelistMocks.validate).not.toHaveBeenCalled();
    });
  });
});