import { Controller, Get, UseGuards, Post, Req, Body } from '@nestjs/common';

import { createResult, ResultCode, ResultData } from '@backend/model';
import { PrismaService } from '@backend/prisma.service';
import { safeParseObject } from '@backend/utils';

import { Request } from 'express';

import {
  SystemSettingDto,
  SystemSettingUpdateDto,
} from '../dto/system-setting.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

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
  ): Promise<ResultData<SystemSettingDto>> {
    const userId = request.user?.userId;
    if (!userId) {
      return createResult({
        code: ResultCode.LoginError,
        message: '未登录',
      });
    }

    const setting = await this.prismaService.systemSetting.findUnique({
      where: {
        userId: userId,
      },
      select: {
        ossConfig: true,
      },
    });
    console.log(setting);

    if (setting) {
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: {
          ossConfig: safeParseObject(setting.ossConfig, this.defaultOssConfig),
        },
      });
    }

    await this.prismaService.systemSetting.create({
      data: {
        ossConfig: JSON.stringify(this.defaultOssConfig),
        userId: userId,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: {
        ossConfig: this.defaultOssConfig,
      },
    });
  }

  @Post('update')
  async updateSystemSetting(
    @Req() request: Request,
    @Body() body: SystemSettingUpdateDto,
  ) {
    const userId = request.user?.userId;
    if (!userId) {
      return createResult({
        code: ResultCode.LoginError,
        message: '未登录',
      });
    }

    await this.prismaService.systemSetting.update({
      where: {
        userId: userId,
      },
      data: {
        ossConfig: JSON.stringify(body.ossConfig),
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: '成功',
    });
  }
}
