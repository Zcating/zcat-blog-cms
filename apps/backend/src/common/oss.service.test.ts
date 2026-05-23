import { describe, expect, it, vi, afterEach } from 'vitest';

const mockConfig = vi.hoisted(() => ({
  minioPublicUrl: 'http://localhost:9000',
  minioBucket: 'pictures-bucket',
  minioEndpoint: 'localhost',
  minioPort: 9000,
  minioUseSsl: false,
  minioAccessKey: '',
  minioSecretKey: '',
}));

vi.mock('./config.service', () => ({
  config: mockConfig,
}));

const mockRemoveObject = vi.hoisted(() => vi.fn());
const mockPresignedPutObject = vi.hoisted(() => vi.fn());

vi.mock('minio', () => {
  const MockClient = function () {
    this.removeObject = mockRemoveObject;
    this.presignedPutObject = mockPresignedPutObject;
  };
  return { Client: MockClient };
});

import { ossService } from './oss.service';

describe('ossService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockConfig.minioPublicUrl = 'http://localhost:9000';
    mockConfig.minioBucket = 'pictures-bucket';
  });

  describe('getUrl', () => {
    it('returns url for photo type', () => {
      const url = ossService.getUrl('photo', 'photos/test.jpg');
      expect(url).toBe('http://localhost:9000/pictures-bucket/photos/test.jpg');
    });

    it('returns url for article type', () => {
      const url = ossService.getUrl('article', 'articles/test.jpg');
      expect(url).toBe(
        'http://localhost:9000/pictures-bucket/articles/test.jpg',
      );
    });

    it('returns empty string when public url is not configured', () => {
      mockConfig.minioPublicUrl = '';
      const url = ossService.getUrl('photo', 'test.jpg');
      expect(url).toBe('');
    });

    it('returns url when bucket is not configured', () => {
      mockConfig.minioBucket = '';
      const url = ossService.getUrl('photo', 'test.jpg');
      expect(url).toBe('http://localhost:9000//test.jpg');
    });
  });

  describe('deleteObject', () => {
    it('calls removeObject with correct bucket and key', async () => {
      mockRemoveObject.mockResolvedValueOnce(undefined);
      await ossService.deleteObject('photo', 'photos/test.jpg');
      expect(mockRemoveObject).toHaveBeenCalledWith(
        'pictures-bucket',
        'photos/test.jpg',
      );
    });

    it('propagates error when removeObject fails', async () => {
      mockRemoveObject.mockRejectedValueOnce(new Error('network error'));
      await expect(
        ossService.deleteObject('photo', 'test.jpg'),
      ).rejects.toThrow('network error');
    });

    it('does nothing when bucket is not configured', async () => {
      mockConfig.minioBucket = '';
      await ossService.deleteObject('photo', 'test.jpg');
      expect(mockRemoveObject).not.toHaveBeenCalled();
    });
  });

  describe('presignUploadUrl', () => {
    it('calls presignedPutObject with correct params and expiry', async () => {
      mockPresignedPutObject.mockResolvedValueOnce(
        'http://localhost:9000/pictures-bucket/photos/test.jpg?presigned=abc',
      );
      const url = await ossService.presignUploadUrl('photo', 'photos/test.jpg');
      expect(mockPresignedPutObject).toHaveBeenCalledWith(
        'pictures-bucket',
        'photos/test.jpg',
        60,
      );
      expect(url).toBe(
        'http://localhost:9000/pictures-bucket/photos/test.jpg?presigned=abc',
      );
    });

    it('returns empty string when presignedPutObject fails', async () => {
      mockPresignedPutObject.mockRejectedValueOnce(new Error('timeout'));
      const url = await ossService.presignUploadUrl('photo', 'test.jpg');
      expect(url).toBe('');
    });

    it('returns empty string when bucket is not configured', async () => {
      mockConfig.minioBucket = '';
      const url = await ossService.presignUploadUrl('photo', 'test.jpg');
      expect(url).toBe('');
    });
  });

  describe('facade methods', () => {
    describe('getPrivateUrl', () => {
      it('delegates to getUrl with photo type', () => {
        const url = ossService.getPrivateUrl('photos/test.jpg');
        expect(url).toBe(
          'http://localhost:9000/pictures-bucket/photos/test.jpg',
        );
      });
    });

    describe('getArticleUrl', () => {
      it('delegates to getUrl with article type', () => {
        const url = ossService.getArticleUrl('articles/test.jpg');
        expect(url).toBe(
          'http://localhost:9000/pictures-bucket/articles/test.jpg',
        );
      });
    });

    describe('deleteFile (facade)', () => {
      it('delegates to deleteObject with photo type', async () => {
        mockRemoveObject.mockResolvedValueOnce(undefined);
        const result = await ossService.deleteFile('photos/test.jpg');
        expect(result).toBe(true);
        expect(mockRemoveObject).toHaveBeenCalledWith(
          'pictures-bucket',
          'photos/test.jpg',
        );
      });

      it('returns false on error', async () => {
        mockRemoveObject.mockRejectedValueOnce(new Error('error'));
        const result = await ossService.deleteFile('test.jpg');
        expect(result).toBe(false);
      });
    });
  });
});
