import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as qiniu from 'qiniu';

@Injectable()
export class OssService {
  private readonly bucketManager: qiniu.rs.BucketManager;
  private readonly domain: string;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);

    this.domain = this.configService.get<string>('OSS_DOMAIN') ?? '';
    this.bucketName = this.configService.get<string>('OSS_BUCKET') ?? '';
  }

  getPrivateUrl(directoryName: string, filename: string) {
    if (!filename) {
      return '';
    }
    // 一小时有效期
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    return this.bucketManager.privateDownloadUrl(
      this.domain,
      `${directoryName}/${filename}`,
      deadline,
    );
  }

  async deleteFile(directoryName: string, filename: string) {
    try {
      await this.bucketManager.delete(
        this.bucketName,
        `${directoryName}/${filename}`,
      );
      return true;
    } catch {
      return false;
    }
  }
}
