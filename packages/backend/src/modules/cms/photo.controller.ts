import {
  Controller,
  Get,
  Post,
  Body,
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
import { createStandardImage, safeNumber } from '@backend/utils';

import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';

import { Photo } from '../../table/photo.entity';

import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('照片管理')
@Controller('api/cms/photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
  static readonly UPLOAD_PATH = 'uploads/photos';
  static readonly THUMBNAIL_PATH = 'uploads/photos/thumbnails';

  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有照片' })
  @ApiResponse({ status: 200, description: '成功获取照片列表' })
  async findAll(): Promise<ResultData<Photo[]>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoRepository.find(),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取照片' })
  @ApiParam({ name: 'id', description: '照片ID' })
  @ApiResponse({ status: 200, description: '成功获取照片详情' })
  async findOne(@Param('id') id: string): Promise<ResultData<Photo | null>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoRepository.findOne({
        where: { id: parseInt(id) },
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: '创建照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片创建成功' })
  @UseInterceptors(
    FileInterceptor('image', {
      dest: PhotoController.UPLOAD_PATH,
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
  async create(
    @UploadedFile() image: Express.Multer.File | null,
    @Body('name') name: string,
    @Body('albumId') albumId: string,
  ): Promise<ResultData<Photo>> {
    const result = await createStandardImage({
      uploadPath: PhotoController.UPLOAD_PATH,
      thumbnailPath: PhotoController.THUMBNAIL_PATH,
      file: image,
    });
    // 如果有文件上传，使用文件信息
    if (!result) {
      // 如果没有文件上传，返回错误
      return createResult({
        code: 'ERR0004',
        message: '请选择要上传的文件',
      });
    }

    const safeAlbum = createIdObject(albumId);

    const savedPhoto = await this.photoRepository.save({
      name: name,
      url: result?.baseFilePath,
      thumbnailUrl: result?.thumbnailFilePath,
      album: safeAlbum,
    });

    return createResult({
      code: '0000',
      message: '照片创建成功',
      data: savedPhoto,
    });
  }

  @Post('/update')
  @ApiOperation({ summary: '更新照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片信息更新成功' })
  @UseInterceptors(
    FileInterceptor('image', {
      dest: PhotoController.UPLOAD_PATH,
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
  async update(
    @UploadedFile() image: Express.Multer.File | null,
    @Body('id') id: string,
    @Body('name') name: string,
    @Body('albumId') albumId: string,
  ): Promise<ResultData<Photo | null>> {
    const imageUrlResult = await createStandardImage({
      uploadPath: PhotoController.UPLOAD_PATH,
      thumbnailPath: PhotoController.THUMBNAIL_PATH,
      file: image,
    });

    const safeAlbum = createIdObject(albumId);

    const result = await this.photoRepository.update(id, {
      name,
      url: imageUrlResult?.baseFilePath,
      thumbnailUrl: imageUrlResult?.thumbnailFilePath,
      album: safeAlbum,
    });

    if (result.affected === 0) {
      return createResult({
        code: 'ERR0003',
        message: '更新失败',
      });
    }

    const photo = await this.photoRepository.findOne({
      where: { id: parseInt(id) },
    });

    return createResult({
      code: '0000',
      message: '成功',
      data: photo,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除照片' })
  @ApiParam({ name: 'id', description: '照片ID' })
  @ApiResponse({ status: 200, description: '照片删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    const result = await this.photoRepository.delete(id);
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
}

function createIdObject(id: string | number) {
  const safeId = safeNumber(id);
  return safeId !== 0
    ? {
        id: safeId,
      }
    : undefined;
}
