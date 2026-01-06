import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OssService } from '@backend/common';
import { createResult, ResultCode } from '@backend/model';

import * as qiniu from 'qiniu';

import { JwtAuthGuard } from '../jwt-auth.guard';
import { UploadTokenDto } from '../schemas/system-setting.schema';

@Controller('api/cms/system-setting')
@UseGuards(JwtAuthGuard)
export class SystemSettingController {
  private readonly logger = new Logger(SystemSettingController.name);

  constructor(
    private configService: ConfigService,
    private ossService: OssService,
  ) {}

  @Get('upload-token')
  getUpdloadToken(@Query() params: UploadTokenDto) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';

    const bucket = this.ossService.getBucket(params.type);

    this.logger.log('上传 token 参数', {
      accessKey,
      secretKey,
      bucketName: bucket,
    });

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
