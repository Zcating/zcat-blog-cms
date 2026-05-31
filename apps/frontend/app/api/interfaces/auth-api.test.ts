import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loginMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
}));

vi.stubGlobal('fetch', loginMock);

import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls login endpoint via BFF auth route', async () => {
    loginMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: '0000', message: '登录成功' }),
    });

    await AuthApi.login({
      username: 'admin',
      password: '123456',
    });

    expect(loginMock).toHaveBeenCalledWith('/api/auth-bff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123456' }),
    });
  });

  it('throws on login error', async () => {
    loginMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ code: 'ERR0002', message: '用户名或密码错误' }),
    });

    await expect(
      AuthApi.login({ username: 'admin', password: 'wrong' }),
    ).rejects.toMatchObject({
      _tag: 'LoginError',
      message: '用户名或密码错误',
    });
  });

  it('calls logout endpoint via BFF auth route', async () => {
    loginMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: '0000', message: '已登出' }),
    });

    await AuthApi.logout();

    expect(loginMock).toHaveBeenCalledWith('/api/auth-bff/logout', {
      method: 'POST',
    });
  });
});
