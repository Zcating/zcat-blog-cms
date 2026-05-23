import { describe, expect, it, vi } from 'vitest';

import { UserApi } from './user-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('UserApi', () => {
  it('userInfo calls HttpClient.get and parses contact', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({
      name: 'zcat',
      contact: '{"email":"a@b.com","github":"https://github.com/zcat"}',
      occupation: 'dev',
      avatar: '/ava.jpg',
      aboutMe: 'bio',
      abstract: 'summary',
    });

    const result = await UserApi.userInfo();
    expect(HttpClient.get).toHaveBeenCalledWith({ path: 'cms/user-info' });
    expect(result.name).toBe('zcat');
    expect(result.contact.email).toBe('a@b.com');
  });

  it('userInfo defaults contact when parsing fails', async () => {
    vi.mocked(HttpClient.get).mockResolvedValueOnce({
      name: 'test',
      contact: 'invalid{json',
      occupation: '',
      avatar: '',
      aboutMe: '',
      abstract: '',
    });

    const result = await UserApi.userInfo();
    expect(result.contact.email).toBe('');
    expect(result.contact.github).toBe('');
  });
});
