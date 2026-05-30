import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIsValid = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() =>
  vi.fn((path: string) => ({ __redirect: path })),
);

vi.mock('../api/interfaces/user-api', () => ({
  UserApi: {
    isValid: mockIsValid,
  },
}));

vi.mock('react-router', () => ({
  redirect: mockRedirect,
}));

import { authMiddleware } from './auth-middleware';

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('跳过首页公开路由', async () => {
    const next = vi.fn().mockResolvedValueOnce('ok');

    const result = await authMiddleware(
      { request: new Request('https://frontend.test/') },
      next,
    );

    expect(mockIsValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(result).toBe('ok');
  });

  it('跳过登录公开路由', async () => {
    const next = vi.fn().mockResolvedValueOnce('ok');

    const result = await authMiddleware(
      { request: new Request('https://frontend.test/login') },
      next,
    );

    expect(mockIsValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(result).toBe('ok');
  });

  it('跳过 /api/ 前缀请求', async () => {
    const next = vi.fn().mockResolvedValueOnce('ok');

    const result = await authMiddleware(
      { request: new Request('https://frontend.test/api/bff/auth/is-valid') },
      next,
    );

    expect(mockIsValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(result).toBe('ok');
  });

  it('在登录态无效时重定向到 /login', async () => {
    const next = vi.fn();
    mockIsValid.mockResolvedValueOnce(false);

    await expect(
      authMiddleware(
        { request: new Request('https://frontend.test/dashboard') },
        next,
      ),
    ).rejects.toEqual({ __redirect: '/login' });

    expect(mockIsValid).toHaveBeenCalledOnce();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  it('在登录态有效时继续执行后续中间件', async () => {
    const next = vi.fn().mockResolvedValueOnce({ ok: true });
    mockIsValid.mockResolvedValueOnce(true);

    const result = await authMiddleware(
      { request: new Request('https://frontend.test/dashboard') },
      next,
    );

    expect(mockIsValid).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });
});
