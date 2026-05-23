import { describe, expect, it, vi } from 'vitest';

import { UserApi } from './blog-api';
import { HttpClient } from '../http/http-client';

vi.mock('../http/http-client', () => ({
  HttpClient: {
    serverSideGet: vi.fn(),
  },
}));

describe('UserApi', () => {
  it('getUserInfo calls serverSideGet and fills missing contact fields', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      name: 'zcat',
      occupation: 'dev',
      abstract: 'hello',
      aboutMe: 'bio',
      avatar: 'ava.jpg',
      contact: { email: 'a@b.com', github: '' },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });

    const result = await UserApi.getUserInfo();
    expect(result.name).toBe('zcat');
    expect(result.contact.email).toBe('a@b.com');
    expect(result.contact.github).toBe('');
  });

  it('getUserInfo defaults contact fields when contact is missing', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      name: 'test',
      occupation: '',
      abstract: '',
      aboutMe: '',
      avatar: '',
      createdAt: '',
      updatedAt: '',
    });

    const result = await UserApi.getUserInfo();
    expect(result.contact.email).toBe('');
    expect(result.contact.github).toBe('');
  });

  it('getUserInfo calls the correct path', async () => {
    vi.mocked(HttpClient.serverSideGet).mockResolvedValueOnce({
      name: 'zcat',
      occupation: '',
      abstract: '',
      aboutMe: '',
      avatar: '',
      createdAt: '',
      updatedAt: '',
    });

    await UserApi.getUserInfo();
    expect(HttpClient.serverSideGet).toHaveBeenCalledWith('blog/user-info');
  });
});
