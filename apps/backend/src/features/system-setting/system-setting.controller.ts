import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { createResult, ResultCode } from '@backend/model';

import { CmsJwtAuthGuard } from '../cms/cms-jwt-auth.guard';

import { UploadTokenDto } from './system-setting.schema';
import { SystemSettingService } from './system-setting.service';

@Controller('api/cms/system-setting')
@UseGuards(CmsJwtAuthGuard)
export class SystemSettingController {
  constructor(private systemSettingService: SystemSettingService) {}

  @Get('upload-token')
  getUploadToken(@Query() params: UploadTokenDto) {
    const uploadToken = this.systemSettingService.getUploadToken(params);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        uploadToken,
      },
    });
  }
}
