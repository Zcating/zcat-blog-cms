import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as qiniu from 'qiniu';

import { OssService } from '@backend/common';

import { UploadTokenDto } from './system-setting.schema';

@Injectable()
export class SystemSettingService {
  constructor(
    private configService: ConfigService,
    private ossService: OssService,
  ) {}

  getUploadToken(params: UploadTokenDto) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const bucket = this.ossService.getBucket(params.type);

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket,
      expires: 60,
    });

    return putPolicy.uploadToken(mac);
  }
}
