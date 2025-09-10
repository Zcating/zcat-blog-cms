import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as qiniu from 'qiniu';

@Injectable()
export class OssService {
  private readonly bucketManager: qiniu.rs.BucketManager;
  private readonly domain: string;

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);

    this.domain = this.configService.get<string>('OSS_DOMAIN') ?? '';
  }

  getPrivateUrl(filename: string) {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    return this.bucketManager.privateDownloadUrl(
      this.domain,
      filename,
      deadline,
    );
  }
}
