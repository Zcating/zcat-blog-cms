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
import { createBaseImage, createThumbnail, safeNumber } from '@backend/utils';

import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';

import { Photo } from '../../table/photo.entity';

import { UpdatePhotoDto } from './dto';
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
    @UploadedFile() image: Express.Multer.File,
    @Body('name') name: string,
    @Body('albumId') albumId: string,
  ): Promise<ResultData<Photo>> {
    // 如果有文件上传，使用文件信息
    if (!image) {
      // 如果没有文件上传，返回错误
      return createResult({
        code: 'ERR0004',
        message: '请选择要上传的文件',
      });
    }

    const safeAlbumId = safeNumber(albumId);

    if (safeAlbumId === 0) {
      return createResult({
        code: 'ERR0005',
        message: '请选择要上传的相册',
      });
    }

    const baseFilename = await createBaseImage(
      PhotoController.UPLOAD_PATH,
      image.originalname,
      image.buffer,
    );

    const thumbnailFilename = await createThumbnail(
      PhotoController.THUMBNAIL_PATH,
      baseFilename,
      image.buffer,
    );

    const savedPhoto = await this.photoRepository.save({
      name: name,
      url: `/${PhotoController.UPLOAD_PATH}/${baseFilename}`,
      thumbnailUrl: `/${PhotoController.THUMBNAIL_PATH}/${thumbnailFilename}`,
      albumId: safeAlbumId,
    });

    return createResult({
      code: '0000',
      message: '照片创建成功',
      data: savedPhoto,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新照片' })
  @ApiParam({ name: 'id', description: '照片ID' })
  @ApiResponse({ status: 200, description: '照片更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
  ): Promise<ResultData<void>> {
    const result = await this.photoRepository.update(id, updatePhotoDto);
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
