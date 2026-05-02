import * as qiniu from 'qiniu';

import { ossService } from '../../../services';

export class SystemSettingService {
  getUploadToken(type: 'article' | 'photo') {
    const accessKey = process.env.OSS_ACCESS_KEY ?? '';
    const secretKey = process.env.OSS_SECRET_KEY ?? '';
    const bucket = ossService.getBucket(type);

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket,
      expires: 60,
    });

    const uploadToken = putPolicy.uploadToken(mac);

    return { uploadToken };
  }
}

export const systemSettingService = new SystemSettingService();
