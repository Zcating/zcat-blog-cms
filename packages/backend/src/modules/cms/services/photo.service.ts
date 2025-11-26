import { Injectable } from '@nestjs/common';

import { OssService, PrismaService } from '@backend/common';
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
    // 先更新相册封面
    if (body.isCover) {
      await this.prisma.photoAlbum.update({
        where: { id: body.albumId },
        data: {
          coverId: body.id,
        },
      });
    }

    // 再更新照片
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

  /**
   * 删除照片
   * @param id 照片ID
   * @returns 删除成功返回true，失败返回false
   */
  async deletePhoto(id: number) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return false;
    }

    // 删除 oss 的数据
    await Promise.allSettled([
      this.ossService.deleteFile('photos', photo.url),
      this.ossService.deleteFile('photos', photo.thumbnailUrl),
    ]);

    // 删除数据库记录
    await this.prisma.photo.delete({
      where: { id },
    });

    return true;
  }

  /**
   * 获取相册列表
   * @returns 相册列表
   */
  async getAlbums() {
    const albums = await this.prisma.photoAlbum.findMany();
    const covers = await this.prisma.photo.findMany({
      where: {
        id: {
          in: albums.map((album) => album.coverId).filter((id) => id !== null),
        },
      },
    });

    const result = albums.map((album) => {
      const foundedCover = covers.find((cover) => cover.id === album.coverId);
      const cover = foundedCover ? this.transformPhoto(foundedCover) : null;
      return {
        id: album.id,
        name: album.name,
        description: album.description,
        coverId: album.coverId,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        available: album.available,
        cover,
      };
    });

    return result;
  }

  /**
   * 转换照片为私有URL
   * @param {Photo} photo 照片
   * @returns {Photo} 转换后的照片
   */
  transformPhoto(photo: Photo): Photo {
    return {
      ...photo,
      url: this.ossService.getPrivateUrl('photos', photo.url),
      thumbnailUrl: this.ossService.getPrivateUrl('photos', photo.thumbnailUrl),
    };
  }
}
