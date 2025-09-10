import { Injectable } from '@nestjs/common';

import { OssService, PrismaService } from '@backend/core';
import { Photo } from '@backend/prisma';

import { isNumber } from 'class-validator';

import {
  CreateAlbumPhotoDto,
  CreatePhotoDto,
  UpdateAlbumPhotoDto,
  UpdateAlbumPhotoResultDto,
  UpdatePhotoDto,
} from '../dto';

@Injectable()
export class PhotoService {
  constructor(
    private prisma: PrismaService,
    private ossService: OssService,
  ) {}

  async getPhotos(albumId?: number | null) {
    if (isNumber(albumId) && albumId <= 0) {
      return [];
    }

    const photos = await this.prisma.photo.findMany({
      where: {
        albumId: albumId,
      },
    });

    return photos.map((photo) => this.transformPhoto(photo));
  }

  async getPhoto(id: number) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return null;
    }

    return this.transformPhoto(photo);
  }

  async createPhoto(body: CreatePhotoDto): Promise<Photo> {
    // const imageUrlResult = await createImageUrls(image);
    const photo = await this.prisma.photo.create({
      data: {
        name: body.name,
        url: body.url || '',
        thumbnailUrl: body.thumbnailUrl || '',
        albumId: body.albumId,
      },
    });

    return this.transformPhoto(photo);
  }

  async updatePhoto(body: UpdatePhotoDto): Promise<Photo> {
    const result = await this.prisma.photo.update({
      where: { id: body.id },
      data: {
        name: body.name,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        albumId: body.albumId,
      },
    });

    return this.transformPhoto(result);
  }

  /**
   * 创建相册照片
   * @param body 创建照片参数
   * @returns 创建成功返回照片，失败返回null
   */
  async createAlbumPhoto(body: CreateAlbumPhotoDto): Promise<Photo> {
    const photo = await this.prisma.photo.create({
      data: {
        name: body.name,
        url: body.url || '',
        thumbnailUrl: body.thumbnailUrl || '',
        albumId: body.albumId,
      },
    });

    return this.transformPhoto(photo);
  }

  /**
   * 更新相册照片
   * @param image 照片文件
   * @param body 更新照片参数
   * @returns 更新成功返回照片，失败返回null
   */
  async updateAlbumPhoto(
    body: UpdateAlbumPhotoDto,
  ): Promise<UpdateAlbumPhotoResultDto | null> {
    if (body.isCover) {
      await this.prisma.photoAlbum.update({
        where: { id: body.albumId },
        data: {
          coverId: body.id,
        },
      });
    }

    const updatedPhoto = await this.prisma.photo.update({
      where: { id: body.id },
      data: {
        name: body.name,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        albumId: body.albumId,
      },
    });

    return {
      ...this.transformPhoto(updatedPhoto),
      albumId: body.albumId,
      isCover: body.isCover,
    };
  }

  transformPhoto(photo: Photo) {
    return {
      ...photo,
      url: this.ossService.getPrivateUrl(photo.url),
      thumbnailUrl: this.ossService.getPrivateUrl(photo.thumbnailUrl),
    };
  }
}
