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
  class MockClient {
    removeObject = mockRemoveObject;
    presignedPutObject = mockPresignedPutObject;
  }
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
    it('returns url with bucket prefix', () => {
      const url = ossService.getUrl('photos/test.jpg');
      expect(url).toBe('http://localhost:9000/pictures-bucket/photos/test.jpg');
    });

    it('returns empty string when public url is not configured', () => {
      mockConfig.minioPublicUrl = '';
      const url = ossService.getUrl('test.jpg');
      expect(url).toBe('');
    });
  });

  describe('deleteObject', () => {
    it('calls removeObject with correct bucket and key', async () => {
      mockRemoveObject.mockResolvedValueOnce(undefined);
      await ossService.deleteObject('photos/test.jpg');
      expect(mockRemoveObject).toHaveBeenCalledWith(
        'pictures-bucket',
        'photos/test.jpg',
      );
    });

    it('propagates error when removeObject fails', async () => {
      mockRemoveObject.mockRejectedValueOnce(new Error('network error'));
      await expect(ossService.deleteObject('test.jpg')).rejects.toThrow(
        'network error',
      );
    });

    it('does nothing when bucket is not configured', async () => {
      mockConfig.minioBucket = '';
      await ossService.deleteObject('test.jpg');
      expect(mockRemoveObject).not.toHaveBeenCalled();
    });
  });

  describe('presignUploadUrl', () => {
    it('calls presignedPutObject with correct params and expiry', async () => {
      mockPresignedPutObject.mockResolvedValueOnce(
        'http://localhost:9000/pictures-bucket/photos/test.jpg?presigned=abc',
      );
      const url = await ossService.presignUploadUrl('photos/test.jpg');
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
      const url = await ossService.presignUploadUrl('test.jpg');
      expect(url).toBe('');
    });

    it('returns empty string when bucket is not configured', async () => {
      mockConfig.minioBucket = '';
      const url = await ossService.presignUploadUrl('test.jpg');
      expect(url).toBe('');
    });
  });

  describe('facade methods', () => {
    it('getPrivateUrl delegates to getUrl', () => {
      const url = ossService.getPrivateUrl('photos/test.jpg');
      expect(url).toBe('http://localhost:9000/pictures-bucket/photos/test.jpg');
    });

    it('getArticleUrl delegates to getUrl', () => {
      const url = ossService.getArticleUrl('articles/test.jpg');
      expect(url).toBe(
        'http://localhost:9000/pictures-bucket/articles/test.jpg',
      );
    });

    it('deleteFile delegates to deleteObject', async () => {
      mockRemoveObject.mockResolvedValueOnce(undefined);
      const result = await ossService.deleteFile('photos/test.jpg');
      expect(result).toBe(true);
      expect(mockRemoveObject).toHaveBeenCalledWith(
        'pictures-bucket',
        'photos/test.jpg',
      );
    });

    it('deleteFile returns false on error', async () => {
      mockRemoveObject.mockRejectedValueOnce(new Error('error'));
      const result = await ossService.deleteFile('test.jpg');
      expect(result).toBe(false);
    });
  });
});
