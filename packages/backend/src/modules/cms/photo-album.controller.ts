import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, ResultData } from '@backend/model';
import { Photo } from '@backend/table';
import {
  createStandardImage,
  THUMBNAIL_PATH,
  UPLOAD_PATH,
} from '@backend/utils';

import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';

import { PhotoAlbum } from '../../table/photo-album.entity';

import {
  CreatePhotoAlbumDto,
  UpdateAlbumDto,
  UpdateAlbumPhotoDto,
  UpdateAlbumPhotoResultDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('相册管理')
@Controller('api/cms/photo-albums')
@UseGuards(JwtAuthGuard)
export class PhotoAlbumController {
  constructor(
    @InjectRepository(PhotoAlbum)
    private photoAlbumRepository: Repository<PhotoAlbum>,
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有相册' })
  @ApiResponse({ status: 200, description: '成功获取相册列表' })
  async findAll(): Promise<ResultData<PhotoAlbum[]>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoAlbumRepository.find(),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '成功获取相册详情' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResultData<PhotoAlbum | null>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoAlbumRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['photos'],
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: '创建相册' })
  @ApiResponse({ status: 200, description: '相册创建成功' })
  async create(
    @Body() createPhotoAlbumDto: CreatePhotoAlbumDto,
  ): Promise<ResultData<PhotoAlbum>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoAlbumRepository.save(createPhotoAlbumDto),
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updatePhotoAlbumDto: UpdateAlbumDto,
  ): Promise<ResultData<void>> {
    const result = await this.photoAlbumRepository.update(
      id,
      updatePhotoAlbumDto,
    );
    if (result.affected === 0) {
      return createResult({
        code: 'ERR0003',
        message: '更新失败',
      });
    }
    return createResult({
      code: '0000',
      message: '成功',
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    const result = await this.photoAlbumRepository.delete(id);
    if (result.affected === 0) {
      return createResult({
        code: 'ERR0003',
        message: '删除失败',
      });
    }
    return createResult({
      code: '0000',
      message: '成功',
    });
  }

  @Post('/photo/update')
  @ApiOperation({ summary: '更新照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片信息更新成功' })
  @UseInterceptors(
    FileInterceptor('image', {
      dest: UPLOAD_PATH,
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('只支持图片文件格式'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async updateAlbumPhoto(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: UpdateAlbumPhotoDto,
  ): Promise<ResultData<UpdateAlbumPhotoResultDto | null>> {
    const imageUrlResult = await createStandardImage({
      uploadPath: UPLOAD_PATH,
      thumbnailPath: THUMBNAIL_PATH,
      file: image,
    });

    const { id, name, albumId, isCover } = body;

    const result = await this.photoRepository.update(id, {
      name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: { id: albumId },
    });

    if (result.affected === 0) {
      return createResult({
        code: 'ERR0003',
        message: '更新失败',
      });
    }

    if (isCover) {
      const updateResult = await this.photoAlbumRepository.update(albumId, {
        cover: { id },
      });
      if (updateResult.affected === 0) {
        return createResult({
          code: 'ERR0003',
          message: '更新失败',
        });
      }
    }

    const photo = await this.photoRepository.findOne({
      where: { id: id },
    });

    if (!photo) {
      return createResult({
        code: 'ERR0003',
        message: '更新失败',
      });
    }

    return createResult({
      code: '0000',
      message: '成功',
      data: {
        id: photo.id,
        name: photo.name,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
        isCover: isCover,
        albumId: albumId,
      },
    });
  }
}
