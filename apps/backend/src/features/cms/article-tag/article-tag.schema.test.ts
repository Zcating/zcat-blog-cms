import { describe, expect, it } from 'vitest';

import { CreateArticleTagDtoSchema, UpdateArticleTagDtoSchema } from './article-tag.schema';

describe('article-tag schema', () => {
  describe('CreateArticleTagDtoSchema', () => {
    it('accepts valid tag name', () => {
      const result = CreateArticleTagDtoSchema.safeParse({ name: '技术' });
      expect(result.success).toBe(true);
    });

    it('rejects empty tag name', () => {
      const result = CreateArticleTagDtoSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateArticleTagDtoSchema', () => {
    it('accepts optional name', () => {
      const result = UpdateArticleTagDtoSchema.safeParse({ name: '新标签' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = UpdateArticleTagDtoSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
