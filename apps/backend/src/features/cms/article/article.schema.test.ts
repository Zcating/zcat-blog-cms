import { describe, expect, it } from 'vitest';

import { CreateArticleDtoSchema, UpdateArticleDtoSchema } from './article.schema';

describe('article schema', () => {
  describe('CreateArticleDtoSchema', () => {
    it('accepts valid article data', () => {
      const result = CreateArticleDtoSchema.safeParse({
        title: 'Hello',
        excerpt: 'Summary',
        content: '# Content',
      });
      expect(result.success).toBe(true);
    });

    it('accepts with publishAt and tagIds', () => {
      const result = CreateArticleDtoSchema.safeParse({
        title: 'Test',
        excerpt: 'Excerpt',
        content: 'Content',
        publishAt: '2026-01-01',
        tagIds: ['1', '2'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = CreateArticleDtoSchema.safeParse({
        title: '',
        excerpt: 'Summary',
        content: 'Content',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = CreateArticleDtoSchema.safeParse({ title: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateArticleDtoSchema', () => {
    it('accepts valid update data', () => {
      const result = UpdateArticleDtoSchema.safeParse({
        id: 1,
        title: 'Updated',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty update (all optional except id)', () => {
      const result = UpdateArticleDtoSchema.safeParse({ id: 1 });
      expect(result.success).toBe(true);
    });

    it('rejects non-positive id', () => {
      const result = UpdateArticleDtoSchema.safeParse({ id: 0 });
      expect(result.success).toBe(false);
    });
  });
});
