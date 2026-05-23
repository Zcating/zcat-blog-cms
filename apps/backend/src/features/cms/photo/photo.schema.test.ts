import { describe, expect, it } from 'vitest';

import {
  CreatePhotoDtoSchema,
  AddPhotosDtoSchema,
  UpdatePhotoDtoSchema,
  GetPhotosDtoSchema,
} from './photo.schema';

describe('photo schema', () => {
  describe('CreatePhotoDtoSchema', () => {
    it('accepts valid photo data', () => {
      const result = CreatePhotoDtoSchema.safeParse({
        name: 'Photo',
        url: '/img.jpg',
        thumbnailUrl: '/thumb.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts with albumId and isCover', () => {
      const result = CreatePhotoDtoSchema.safeParse({
        name: 'Photo',
        url: '/img.jpg',
        thumbnailUrl: '/thumb.jpg',
        albumId: '1',
        isCover: 'true',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = CreatePhotoDtoSchema.safeParse({
        name: '',
        url: '/img.jpg',
        thumbnailUrl: '/thumb.jpg',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AddPhotosDtoSchema', () => {
    it('accepts valid data', () => {
      const result = AddPhotosDtoSchema.safeParse({
        albumId: 1,
        photoIds: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdatePhotoDtoSchema', () => {
    it('accepts valid update', () => {
      const result = UpdatePhotoDtoSchema.safeParse({
        id: 1,
        name: 'New name',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('GetPhotosDtoSchema', () => {
    it('accepts with albumId filter', () => {
      const result = GetPhotosDtoSchema.safeParse({
        albumId: 1,
        page: 1,
        pageSize: 20,
      });
      expect(result.success).toBe(true);
    });
  });
});
