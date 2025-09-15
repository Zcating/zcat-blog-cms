import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createResult, ResultCode } from '@backend/model';

import * as qiniu from 'qiniu';

import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('api/cms/system-setting')
@UseGuards(JwtAuthGuard)
export class SystemSettingController {
  private readonly logger = new Logger(SystemSettingController.name);

  constructor(private configService: ConfigService) {}

  @Get('upload-token')
  getUpdloadToken() {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const bucket = this.configService.get<string>('OSS_BUCKET') ?? '';

    this.logger.log('上传 token 参数', { accessKey, secretKey, bucket });

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket,
      expires: 60,
    });
    const uploadToken = putPolicy.uploadToken(mac);

    this.logger.log('上传 token 生成成功', uploadToken);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        uploadToken,
      },
    });
  }
}
