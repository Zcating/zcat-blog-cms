import { describe, expect, it } from 'vitest';

import { UserInfoSchema } from './user-info.schema';

describe('user-info schema', () => {
  describe('UserInfoSchema', () => {
    it('accepts valid user info', () => {
      const result = UserInfoSchema.safeParse({
        name: 'zcat',
        contact: { email: 'test@example.com', github: 'https://github.com/zcat' },
        occupation: 'Developer',
        avatar: '/ava.jpg',
        aboutMe: 'About me',
        abstract: 'Abstract',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = UserInfoSchema.safeParse({
        name: 'zcat',
        contact: { email: 'not-an-email', github: '' },
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = UserInfoSchema.safeParse({
        name: '',
        contact: { email: 'test@example.com', github: '' },
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
