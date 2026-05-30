import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());

vi.mock('../http/http-client', () => ({
  HttpClient: {
    get: mockGet,
    post: mockPost,
  },
}));

import { UserApi } from './user-api';

describe('UserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('userInfo', () => {
    it('fetches and parses user info', async () => {
      mockGet.mockResolvedValueOnce({
        name: 'Admin',
        contact: JSON.stringify({ email: 'admin@test.com', github: 'admin' }),
        occupation: 'Developer',
        avatar: 'avatar.jpg',
        aboutMe: 'About me',
        abstract: 'Abstract',
      });

      const result = await UserApi.userInfo();

      expect(mockGet).toHaveBeenCalledWith({ path: 'cms/user-info' });
      expect(result.name).toBe('Admin');
      expect(result.contact.email).toBe('admin@test.com');
      expect(result.contact.github).toBe('admin');
      expect(result.occupation).toBe('Developer');
    });

    it('falls back to default contact when contact is empty string', async () => {
      mockGet.mockResolvedValueOnce({
        name: 'Admin',
        contact: '',
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

  describe('updateUserInfo', () => {
    it('sends serialized contact and returns parsed result', async () => {
      mockPost.mockResolvedValueOnce({
        name: 'Updated',
        contact: JSON.stringify({ email: 'u@test.com', github: 'u' }),
        occupation: 'Dev',
        avatar: '',
        aboutMe: '',
        abstract: '',
      });

      const result = await UserApi.updateUserInfo({
        name: 'Updated',
        contact: { email: 'u@test.com', github: 'u' },
      });

      expect(mockPost).toHaveBeenCalledWith({
        path: 'cms/user-info/update',
        params: {
          name: 'Updated',
          contact: { email: 'u@test.com', github: 'u' },
        },
      });
      expect(result.contact.email).toBe('u@test.com');
      expect(result.contact.github).toBe('u');
    });
  });

  describe('isValid', () => {
    it('returns true when api responds valid=true', async () => {
      mockPost.mockResolvedValueOnce({ valid: true });

      const result = await UserApi.isValid();

      expect(mockPost).toHaveBeenCalledWith({ path: 'auth/is-valid' });
      expect(result).toBe(true);
    });

    it('returns false when api responds valid=false', async () => {
      mockPost.mockResolvedValueOnce({ valid: false });

      const result = await UserApi.isValid();

      expect(mockPost).toHaveBeenCalledWith({ path: 'auth/is-valid' });
      expect(result).toBe(false);
    });
  });
});
