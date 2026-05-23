import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPresignUploadUrl = vi.hoisted(() => vi.fn());

vi.mock('../../../common', () => ({
  ossService: {
    presignUploadUrl: mockPresignUploadUrl,
  },
}));

import { systemSettingService } from './system-setting.service';

describe('systemSettingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUploadConfig', () => {
    it('returns presignedUrl for photo type with given key', async () => {
      mockPresignUploadUrl.mockResolvedValueOnce(
        'http://localhost:9000/photos-bucket/photos/test.jpg?presigned=abc',
      );
      const result = await systemSettingService.getUploadConfig(
        'photo',
        'photos/test.jpg',
      );

      expect(result).toEqual({
        presignedUrl:
          'http://localhost:9000/photos-bucket/photos/test.jpg?presigned=abc',
      });
      expect(mockPresignUploadUrl).toHaveBeenCalledWith(
        'photo',
        'photos/test.jpg',
      );
    });

    it('returns presignedUrl for article type with given key', async () => {
      mockPresignUploadUrl.mockResolvedValueOnce(
        'http://localhost:9000/articles-bucket/articles/test.jpg?presigned=def',
      );
      const result = await systemSettingService.getUploadConfig(
        'article',
        'articles/test.jpg',
      );

      expect(result).toEqual({
        presignedUrl:
          'http://localhost:9000/articles-bucket/articles/test.jpg?presigned=def',
      });
      expect(mockPresignUploadUrl).toHaveBeenCalledWith(
        'article',
        'articles/test.jpg',
      );
    });
  });
});
