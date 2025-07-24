import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Photo, PhotoAlbum } from '@backend/table';
import { createImageUrls } from '@backend/utils';

import { Repository } from 'typeorm';

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
    @InjectRepository(PhotoAlbum)
    private photoAlbumRepository: Repository<PhotoAlbum>,
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  async createPhoto(
    image: Express.Multer.File | null,
    body: CreatePhotoDto,
  ): Promise<Photo | null> {
    const imageUrlResult = await createImageUrls(image);

    const photo = this.photoRepository.create({
      name: body.name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: body.albumId ? { id: body.albumId } : undefined,
    });

    return this.photoRepository.save(photo);
  }

  async updatePhoto(image: Express.Multer.File | null, body: UpdatePhotoDto) {
    const imageUrlResult = await createImageUrls(image);

    const result = await this.photoRepository.update(body.id, {
      name: body.name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: body.albumId ? { id: body.albumId } : undefined,
    });

    if (result.affected === 0) {
      return null;
    }

    const photo = await this.photoRepository.findOne({
      where: { id: body.id },
    });
    if (!photo) {
      return null;
    }

    return photo;
  }

  /**
   * 创建相册照片
   * @param image 照片文件
   * @param body 创建照片参数
   * @returns 创建成功返回照片，失败返回null
   */
  async createAlbumPhoto(
    image: Express.Multer.File | null,
    body: CreateAlbumPhotoDto,
  ): Promise<Photo | null> {
    const imageUrlResult = await createImageUrls(image);

    const photo = this.photoRepository.create({
      name: body.name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: { id: body.albumId },
    });

    if (body.isCover) {
      await this.photoAlbumRepository.update(body.albumId, {
        cover: { id: photo.id },
      });
    }

    return this.photoRepository.save(photo);
  }

  /**
   * 更新相册照片
   * @param image 照片文件
   * @param body 更新照片参数
   * @returns 更新成功返回照片，失败返回null
   */
  async updateAlbumPhoto(
    image: Express.Multer.File | null,
    body: UpdateAlbumPhotoDto,
  ): Promise<UpdateAlbumPhotoResultDto | null> {
    const imageUrlResult = await createImageUrls(image);

    if (body.isCover) {
      const updateResult = await this.photoAlbumRepository.update(
        body.albumId,
        {
          cover: { id: body.id },
        },
      );
      if (updateResult.affected === 0) {
        return null;
      }
    }

    const result = await this.photoRepository.update(body.id, {
      name: body.name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: { id: body.albumId },
    });

    if (result.affected === 0) {
      return null;
    }

    const photo = await this.photoRepository.findOne({
      where: { id: body.id },
    });

    if (!photo) {
      return null;
    }

    return {
      id: photo.id,
      name: photo.name,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      albumId: body.albumId,
      isCover: body.isCover,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  }
}
