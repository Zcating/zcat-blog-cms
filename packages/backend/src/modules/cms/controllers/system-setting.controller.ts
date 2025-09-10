import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@backend/core';
import { createResult, ResultCode } from '@backend/model';

import * as qiniu from 'qiniu';

import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('api/cms/system-setting')
@UseGuards(JwtAuthGuard)
export class SystemSettingController {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get('upload-token')
  getUpdloadToken() {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const bucket = this.configService.get<string>('OSS_BUCKET') ?? '';

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket,
      expires: 60,
    });
    const uploadToken = putPolicy.uploadToken(mac);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        uploadToken,
      },
    });
  }
}
