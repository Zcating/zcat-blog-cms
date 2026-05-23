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
    it('returns presignedUrl for given key', async () => {
      mockPresignUploadUrl.mockResolvedValueOnce(
        'http://localhost:9000/pictures-bucket/photos/test.jpg?presigned=abc',
      );
      const result =
        await systemSettingService.getUploadConfig('photos/test.jpg');

      expect(result).toEqual({
        presignedUrl:
          'http://localhost:9000/pictures-bucket/photos/test.jpg?presigned=abc',
      });
      expect(mockPresignUploadUrl).toHaveBeenCalledWith('photos/test.jpg');
    });
  });
});
