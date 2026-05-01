import {
  createConfigServiceMock,
  createOssServiceMock,
} from '../test-helpers/service-test-helper';

import { SystemSettingService } from './system-setting.service';

const qiniuMocks = vi.hoisted(() => ({
  mac: vi.fn(),
  putPolicyOptions: vi.fn(),
  uploadToken: vi.fn(() => 'mock-upload-token'),
}));

vi.mock('qiniu', () => {
  function PutPolicy(
    this: { uploadToken: typeof qiniuMocks.uploadToken },
    options: unknown,
  ) {
    qiniuMocks.putPolicyOptions(options);
    this.uploadToken = qiniuMocks.uploadToken;
  }

  return {
    auth: {
      digest: {
        Mac: qiniuMocks.mac,
      },
    },
    rs: {
      PutPolicy,
    },
  };
});

describe('SystemSettingService', () => {
  let configService: ReturnType<typeof createConfigServiceMock>;
  let ossService: ReturnType<typeof createOssServiceMock>;
  let service: SystemSettingService;

  beforeEach(() => {
    configService = createConfigServiceMock({
      OSS_ACCESS_KEY: 'ak-test',
      OSS_SECRET_KEY: 'sk-test',
    });
    ossService = createOssServiceMock();
    service = new SystemSettingService(configService as any, ossService as any);
    vi.clearAllMocks();
  });

  it('getUploadToken builds qiniu policy and returns upload token', () => {
    ossService.getBucket.mockReturnValue('photo-bucket');

    const result = service.getUploadToken({ type: 'photo' } as any);

    expect(configService.get).toHaveBeenCalledWith('OSS_ACCESS_KEY');
    expect(configService.get).toHaveBeenCalledWith('OSS_SECRET_KEY');
    expect(ossService.getBucket).toHaveBeenCalledWith('photo');
    expect(qiniuMocks.mac).toHaveBeenCalledWith('ak-test', 'sk-test');
    expect(qiniuMocks.putPolicyOptions).toHaveBeenCalledWith({
      scope: 'photo-bucket',
      expires: 60,
    });
    expect(qiniuMocks.uploadToken).toHaveBeenCalledTimes(1);
    expect(result).toBe('mock-upload-token');
  });
});
