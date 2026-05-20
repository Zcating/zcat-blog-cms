import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock, saveTokenMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  saveTokenMock: vi.fn(),
}));

vi.mock('../http/http-client', () => ({
  HttpClient: {
    post: postMock,
    saveToken: saveTokenMock,
  },
}));

import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls login endpoint and saves token', async () => {
    postMock.mockResolvedValueOnce({
      accessToken: 'token-from-api',
    });

    await AuthApi.login({
      username: 'admin',
      password: '123456',
    });

    expect(postMock).toHaveBeenCalledWith({
      path: 'auth/login',
      params: {
        username: 'admin',
        password: '123456',
      },
    });
    expect(saveTokenMock).toHaveBeenCalledWith('token-from-api');
  });
});
