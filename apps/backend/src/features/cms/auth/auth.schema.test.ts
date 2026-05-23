import { describe, expect, it } from 'vitest';

import { loginSchema, registerDtoSchema } from './auth.schema';

describe('auth schema', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const result = loginSchema.safeParse({ username: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerDtoSchema', () => {
    it('accepts valid registration', () => {
      const result = registerDtoSchema.safeParse({
        username: 'newuser',
        password: 'pass123',
        email: 'user@test.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const result = registerDtoSchema.safeParse({
        username: 'user',
      });
      expect(result.success).toBe(false);
    });
  });
});
