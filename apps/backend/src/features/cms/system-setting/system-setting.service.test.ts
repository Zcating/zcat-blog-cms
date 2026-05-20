import { describe, expect, it, vi } from 'vitest';

const mockOssService = vi.hoisted(() => ({
  getBucket: vi.fn((type: string) => `${type}-bucket`),
}));

vi.mock('../../../common', () => ({
  ossService: mockOssService,
}));

const mockMacCtor = vi.hoisted(() => vi.fn());
const mockPutPolicyCtor = vi.hoisted(() => vi.fn());

vi.mock('qiniu', () => ({
  auth: {
    digest: {
      Mac: function MockMac(
        this: object,
        accessKey: string,
        secretKey: string,
      ) {
        mockMacCtor(accessKey, secretKey);
        return this;
      },
    },
  },
  rs: {
    PutPolicy: function MockPutPolicy(
      this: { uploadToken: () => string },
      scope: { scope: string; expires: number },
    ) {
      mockPutPolicyCtor(scope);
      this.uploadToken = () => 'qiniu-upload-token';
      return this;
    },
  },
}));

import { systemSettingService } from './system-setting.service';

describe('systemSettingService', () => {
  beforeEach(() => {
    process.env.OSS_ACCESS_KEY = 'test-access-key';
    process.env.OSS_SECRET_KEY = 'test-secret-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUploadToken', () => {
    it('returns upload token for article type', () => {
      const result = systemSettingService.getUploadToken('article');

      expect(result).toEqual({ uploadToken: 'qiniu-upload-token' });
      expect(mockOssService.getBucket).toHaveBeenCalledWith('article');
      expect(mockMacCtor).toHaveBeenCalledWith(
        'test-access-key',
        'test-secret-key',
      );
      expect(mockPutPolicyCtor).toHaveBeenCalledWith({
        scope: 'article-bucket',
        expires: 60,
      });
    });

    it('returns upload token for photo type', () => {
      const result = systemSettingService.getUploadToken('photo');

      expect(result).toEqual({ uploadToken: 'qiniu-upload-token' });
      expect(mockOssService.getBucket).toHaveBeenCalledWith('photo');
    });
  });
});
