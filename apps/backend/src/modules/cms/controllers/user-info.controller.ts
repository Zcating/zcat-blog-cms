import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { createResult, ResultCode } from '@backend/model';

import { JwtAuthGuard } from '../jwt-auth.guard';
import { UserInfoService } from '../services/user-info.service';

interface UpdateUserInfoDto {
  name?: string;
  contact?: string;
  occupation?: string;
  avatar?: string;
  aboutMe?: string;
  abstract?: string;
}

@Controller('api/cms/user-info')
@UseGuards(JwtAuthGuard)
export class UserInfoController {
  private readonly logger = new Logger(UserInfoController.name);

  constructor(private userInfoService: UserInfoService) {}

  @Get()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '用户信息获取成功' })
  async userInfo(@Req() req: Request) {
    const userId = req.user?.userId;
    if (!userId) {
      return createResult({
        code: ResultCode.Success,
        message: 'success',
        data: null,
      });
    }

    this.logger.log(`获取用户信息，用户ID: ${userId}`);
    const result = await this.userInfoService.getUserInfo(userId);

    this.logger.log(`用户信息获取成功，用户ID: ${userId}`);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: result,
    });
  }

  @Post('update')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '用户信息更新成功' })
  async updateUserInfo(@Req() req: Request, @Body() body: UpdateUserInfoDto) {
    const userId = req.user?.userId;
    if (!userId) {
      return createResult({
        code: ResultCode.ValidationError,
        message: 'failed',
      });
    }

    const result = await this.userInfoService.updateUserInfo(userId, body);

    this.logger.log(`用户信息更新成功，用户ID: ${userId}`);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: result,
    });
  }
}
