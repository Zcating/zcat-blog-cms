import { Injectable } from '@nestjs/common';

import { PrismaService } from '@backend/common';
import { PaginateQueryDto } from '@backend/model';
import { createPaginate } from '@backend/utils';

import { AddPhotosDto } from '../photo/photo.schema';
import { PhotoService } from '../photo/photo.service';

import {
  CreatePhotoAlbumDto,
  ReturnPhotoAlbumDto,
  SetCoverDto,
  UpdateAlbumDto,
} from './photo-album.schema';

@Injectable()
export class PhotoAlbumService {
  constructor(
    private prismaService: PrismaService,
    private photoService: PhotoService,
  ) {}

  async findAll(dto: PaginateQueryDto) {
    const [albums, total] = await Promise.all([
      this.prismaService.photoAlbum.findMany({
        orderBy: { createdAt: 'desc' },
        ...createPaginate(dto.page, dto.pageSize),
      }),
      this.prismaService.photoAlbum.count(),
    ]);

    const coverIds = albums
      .map((album) => album.coverId)
      .filter((id): id is number => id !== null);

    const covers =
      coverIds.length > 0
        ? await this.prismaService.photo.findMany({
            where: { id: { in: coverIds } },
          })
        : [];

    const data: ReturnPhotoAlbumDto[] = albums.map((album) => {
      const foundedCover = covers.find((cover) => cover.id === album.coverId);
      const cover = foundedCover
        ? this.photoService.transformPhoto(foundedCover)
        : null;
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

    return {
      data,
      totalPages: Math.ceil(total / dto.pageSize),
      page: dto.page,
      pageSize: dto.pageSize,
      total,
    };
  }

  async findOne(id: string) {
    return this.prismaService.photoAlbum.findUnique({
      where: { id: parseInt(id, 10) },
    });
  }

  async create(createPhotoAlbumDto: CreatePhotoAlbumDto) {
    return this.prismaService.photoAlbum.create({
      data: createPhotoAlbumDto,
    });
  }

  async update(dto: UpdateAlbumDto) {
    return this.prismaService.photoAlbum.update({
      where: { id: dto.id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prismaService.photoAlbum.delete({
      where: { id: parseInt(id, 10) },
    });
  }

  async setCover(setCoverDto: SetCoverDto) {
    return this.prismaService.photoAlbum.update({
      where: { id: setCoverDto.albumId },
      data: {
        coverId: setCoverDto.photoId,
      },
    });
  }

  async batchAddPhotos(batchAddDto: AddPhotosDto) {
    const album = await this.prismaService.photoAlbum.findUnique({
      where: { id: batchAddDto.albumId },
    });
    if (!album) {
      return false;
    }

    await this.prismaService.photo.updateMany({
      where: {
        id: {
          in: batchAddDto.photoIds,
        },
      },
      data: {
        albumId: batchAddDto.albumId,
      },
    });

    return true;
  }
}
