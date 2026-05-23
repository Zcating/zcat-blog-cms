import { describe, expect, it } from 'vitest';

import {
  CreatePhotoAlbumDtoSchema,
  CreateAlbumPhotoDtoSchema,
  UpdateAlbumDtoSchema,
  SetCoverDtoSchema,
} from './photo-album.schema';

describe('photo-album schema', () => {
  describe('CreatePhotoAlbumDtoSchema', () => {
    it('accepts valid album data', () => {
      const result = CreatePhotoAlbumDtoSchema.safeParse({
        name: 'My Album',
      });
      expect(result.success).toBe(true);
    });

    it('accepts with description and coverId', () => {
      const result = CreatePhotoAlbumDtoSchema.safeParse({
        name: 'Album',
        description: 'Desc',
        coverId: '1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = CreatePhotoAlbumDtoSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateAlbumPhotoDtoSchema', () => {
    it('accepts valid data', () => {
      const result = CreateAlbumPhotoDtoSchema.safeParse({
        albumId: 1,
        name: 'Photo',
        url: '/img.jpg',
        thumbnailUrl: '/thumb.jpg',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateAlbumDtoSchema', () => {
    it('accepts partially updating fields', () => {
      const result = UpdateAlbumDtoSchema.safeParse({
        name: 'New Name',
        available: 'true',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('SetCoverDtoSchema', () => {
    it('accepts valid cover data', () => {
      const result = SetCoverDtoSchema.safeParse({
        albumId: 1,
        photoId: 2,
      });
      expect(result.success).toBe(true);
    });
  });
});
