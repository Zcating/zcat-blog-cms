import { describe, expect, it, vi } from 'vitest';

const mockConfig = vi.hoisted(() => ({
  ossEndpoint: 'https://s3.oss-cn-guangzhou.aliyuncs.com',
  ossAccessKey: 'test-access-key',
  ossSecretKey: 'test-secret-key',
  ossBucket: 'pictures-bucket',
}));

vi.mock('./config.service', () => ({
  config: mockConfig,
}));

const {
  mockS3ClientConfig,
  mockSend,
  mockGetSignedUrl,
  MockPutObjectCommand,
  MockGetObjectCommand,
  MockDeleteObjectCommand,
} = vi.hoisted(() => ({
  mockS3ClientConfig: [] as Record<string, unknown>[],
  mockSend: vi.fn(),
  mockGetSignedUrl: vi.fn(),
  MockPutObjectCommand: vi.fn(),
  MockGetObjectCommand: vi.fn(),
  MockDeleteObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = mockSend;

    constructor(options: Record<string, unknown>) {
      mockS3ClientConfig.push(options);
    }
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
    GetObjectCommand: MockGetObjectCommand,
    DeleteObjectCommand: MockDeleteObjectCommand,
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { ossService } from './oss.service';

describe('ossService', () => {
  describe('client construction', () => {
    it('derives the region from the endpoint host', () => {
      expect(mockS3ClientConfig).toHaveLength(1);
      expect(mockS3ClientConfig[0]).toMatchObject({
        region: 'oss-cn-guangzhou',
        endpoint: 'https://s3.oss-cn-guangzhou.aliyuncs.com',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });

    it('never opts into path-style addressing, which Aliyun rejects', () => {
      expect(mockS3ClientConfig[0]).not.toHaveProperty('forcePathStyle');
    });

    it('names the variable, the offending value and the missing scheme', async () => {
      mockConfig.ossEndpoint = 'oss';
      vi.resetModules();

      await expect(import('./oss.service')).rejects.toThrow(
        /OSS_ENDPOINT: "oss".*https:\/\/oss-cn-guangzhou\.aliyuncs\.com/,
      );

      mockConfig.ossEndpoint = 'https://s3.oss-cn-guangzhou.aliyuncs.com';
    });
  });

  describe('presignUploadUrl', () => {
    it('signs a PUT that expires in 60 seconds', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example/put');

      const url = await ossService.presignUploadUrl('photos/test.jpg');

      expect(MockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'pictures-bucket',
        Key: 'photos/test.jpg',
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 60 },
      );
      expect(url).toBe('https://signed.example/put');
    });

    it('signs no ContentMD5 or ContentLength, which would break the signature', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example/put');

      await ossService.presignUploadUrl('photos/test.jpg');

      const commandInput = MockPutObjectCommand.mock.calls[0][0];
      expect(commandInput).not.toHaveProperty('ContentMD5');
      expect(commandInput).not.toHaveProperty('ContentLength');
    });
  });

  describe('presignDownloadUrl', () => {
    it('signs a GET that expires in 3600 seconds', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example/get');

      const url = await ossService.presignDownloadUrl('photos/test.jpg');

      expect(MockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'pictures-bucket',
        Key: 'photos/test.jpg',
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
      expect(url).toBe('https://signed.example/get');
    });

    it('propagates a signing failure instead of handing back an unusable address', async () => {
      mockGetSignedUrl.mockRejectedValueOnce(new Error('no credentials'));

      await expect(
        ossService.presignDownloadUrl('photos/test.jpg'),
      ).rejects.toThrow('no credentials');
    });
  });

  describe('deleteObject', () => {
    it('deletes the object under the configured bucket', async () => {
      mockSend.mockResolvedValueOnce(undefined);

      await ossService.deleteObject('photos/test.jpg');

      expect(MockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'pictures-bucket',
        Key: 'photos/test.jpg',
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('propagates the failure when the delete call fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('network error'));

      await expect(ossService.deleteObject('test.jpg')).rejects.toThrow(
        'network error',
      );
    });
  });

  describe('deleteFile', () => {
    it('reports success when the delete call succeeds', async () => {
      mockSend.mockResolvedValueOnce(undefined);

      await expect(ossService.deleteFile('photos/test.jpg')).resolves.toBe(
        true,
      );
    });

    it('reports failure instead of throwing when the delete call fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('network error'));

      await expect(ossService.deleteFile('test.jpg')).resolves.toBe(false);
    });
  });
});
