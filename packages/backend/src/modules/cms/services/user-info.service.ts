import { Injectable } from '@nestjs/common';

import { OssService, PrismaService } from '@backend/common';

export interface UpdateUserInfoInput {
  name?: string;
  contact?: string;
  occupation?: string;
  avatar?: string;
  aboutMe?: string;
  abstract?: string;
}

@Injectable()
export class UserInfoService {
  constructor(
    private prisma: PrismaService,
    private ossService: OssService,
  ) {}

  async getUserInfo(userId?: number | null) {
    if (!userId) {
      return null;
    }

    let result = await this.prisma.userInfo.findUnique({
      where: { id: userId },
    });

    if (!result) {
      result = await this.prisma.userInfo.create({
        data: {
          name: '',
          contact: '{}',
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
          userId: userId,
        },
      });
    }

    return this.transformUserInfo(result);
  }

  async updateUserInfo(userId: number, body: UpdateUserInfoInput) {
    const updated = await this.prisma.userInfo.update({
      where: { id: userId },
      data: {
        name: body.name,
        contact: body.contact,
        occupation: body.occupation,
        avatar: body.avatar,
        aboutMe: body.aboutMe,
        abstract: body.abstract,
      },
    });

    return this.transformUserInfo(updated);
  }

  private transformUserInfo<T extends { avatar?: string | null }>(
    userInfo: T,
  ): T {
    if (userInfo.avatar) {
      return {
        ...userInfo,
        avatar: this.ossService.getPrivateUrl(userInfo.avatar || ''),
      } as T;
    }
    return userInfo;
  }
}
