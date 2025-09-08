import { Controller, Get, UseGuards, Post, Req, Body } from '@nestjs/common';

import { createResult, ResultCode, ResultData } from '@backend/model';
import { PrismaService } from '@backend/prisma.service';
import { safeObject, safeParseObject } from '@backend/utils';

import { Request } from 'express';

import { SystemSettingUpdateDto } from '../dto/system-setting-update.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

interface SystemSetting {
  id: number;
  userId: number;
  ossConfig: {
    accessKey: string;
    secretKey: string;
  };
}

@Controller('api/cms/system-setting')
@UseGuards(JwtAuthGuard)
export class SystemSettingController {
  private readonly defaultOssConfig = {
    accessKey: '',
    secretKey: '',
  };

  constructor(private prismaService: PrismaService) {}

  @Get()
  async getSystemSetting(
    @Req() request: Request,
  ): Promise<ResultData<SystemSetting>> {
    if (!request.user) {
      return createResult({
        code: ResultCode.LoginError,
        message: '未登录',
      });
    }

    const setting = await this.prismaService.systemSetting.findUnique({
      where: {
        userId: request.user.userId,
      },
    });

    if (setting) {
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: {
          ...setting,
          userId: setting.userId ?? 0,
          ossConfig: safeParseObject(setting.ossConfig, this.defaultOssConfig),
        },
      });
    }

    const createdSetting = await this.prismaService.systemSetting.create({
      data: {
        ossConfig: JSON.stringify(this.defaultOssConfig),
        userId: request.user.userId,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: {
        ...createdSetting,
        userId: createdSetting.userId ?? 0,
        ossConfig: this.defaultOssConfig,
      },
    });
  }

  @Post('update')
  async updateSystemSetting(@Body() body: SystemSettingUpdateDto) {
    // return this.prismaService.systemSetting.update({
    //   where: {
    //     id: 1,
    //   },
    // });
  }
}
