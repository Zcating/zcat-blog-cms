import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';

import { createResult, ResultCode, ResultData } from '@backend/model';
import { Photo } from '@backend/prisma';
import { PrismaService } from '@backend/prisma.service';

import {
  CreateAlbumPhotoDto,
  CreatePhotoDto,
  UpdateAlbumPhotoDto,
  UpdateAlbumPhotoResultDto,
  UpdatePhotoDto,
} from '../dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { PhotoService } from '../services/photo.service';

@ApiTags('照片管理')
@Controller('api/cms/photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
  private readonly logger = new Logger(PhotoController.name);
  static readonly UPLOAD_PATH = 'uploads/photos';
  static readonly THUMBNAIL_PATH = 'uploads/photos/thumbnails';

  constructor(
    private prisma: PrismaService,
    private photoService: PhotoService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有照片' })
  @ApiResponse({ status: 200, description: '成功获取照片列表' })
  async findAll(
    @Query('albumId', new ParseIntPipe({ optional: true })) albumId: number = 0,
  ): Promise<ResultData<Photo[]>> {
    try {
      this.logger.log('开始获取所有照片');

      const photos = await this.prisma.photo.findMany({
        where: {
          albumId: albumId > 0 ? albumId : undefined,
        },
      });

      this.logger.log(`成功获取 ${photos.length} 张照片`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: photos,
      });
    } catch (error) {
      this.logger.error('获取照片列表失败', error);
      throw error;
    }
  }

  @Get('empty-album')
  @ApiOperation({ summary: '获取所有未所属相册的照片' })
  @ApiResponse({ status: 200, description: '成功获取照片列表' })
  async findEmptyAlbumPhotos() {
    try {
      this.logger.log('开始获取所有照片');

      const photos = await this.prisma.photo.findMany({
        where: {
          albumId: {
            equals: null,
          },
        },
      });

      this.logger.log(`成功获取 ${photos.length} 张照片`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: photos,
      });
    } catch (error) {
      this.logger.error('获取照片列表失败', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取照片' })
  @ApiParam({ name: 'id', description: '照片ID' })
  @ApiResponse({ status: 200, description: '成功获取照片详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResultData<Photo | null>> {
    try {
      this.logger.log(`开始获取ID为 ${id} 的照片`);
      const photo = await this.prisma.photo.findUnique({
        where: { id },
      });
      this.logger.log(`${photo ? '成功' : '未找到'}获取ID为 ${id} 的照片`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: photo,
      });
    } catch (error) {
      this.logger.error(`获取ID为 ${id} 的照片失败`, error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: '创建照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片创建成功' })
  async create(@Body() body: CreatePhotoDto): Promise<ResultData<Photo>> {
    try {
      this.logger.log(`开始创建照片: ${body.name || '未提供名称'}`);

      const photo = await this.photoService.createPhoto(body);

      this.logger.log(`成功创建照片，ID: ${photo.id}, 名称: ${photo.name}`);

      return createResult({
        code: ResultCode.Success,
        message: '照片创建成功',
        data: photo,
      });
    } catch (error) {
      this.logger.error('创建照片失败', error);
      throw error;
    }
  }

  @Post('create/with-album')
  @ApiOperation({ summary: '创建相册照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片创建成功' })
  async createAlbumPhoto(
    @Body() body: CreateAlbumPhotoDto,
  ): Promise<ResultData<Photo>> {
    try {
      this.logger.log(`开始创建相册照片: ${body.name || '未提供名称'}`);

      const photo = await this.photoService.createAlbumPhoto(body);

      this.logger.log(`成功创建相册照片，ID: ${photo.id}, 名称: ${photo.name}`);
      return createResult({
        code: ResultCode.Success,
        message: '照片创建成功',
        data: photo,
      });
    } catch (error) {
      this.logger.error('创建相册照片失败', error);
      throw error;
    }
  }

  @Post('/update')
  @ApiOperation({ summary: '更新照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片信息更新成功' })
  async update(
    @Body() body: UpdatePhotoDto,
  ): Promise<ResultData<Photo | null>> {
    try {
      this.logger.log(
        `开始更新照片ID: ${body.id}, 名称: ${body.name || '未提供名称'}`,
      );
      const photo = await this.photoService.updatePhoto(body);

      this.logger.log(`成功更新照片，ID: ${photo.id}, 名称: ${photo.name}`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: photo,
      });
    } catch (error) {
      this.logger.error('更新照片失败', error);
      throw error;
    }
  }

  @Post('/update/with-album')
  @ApiOperation({ summary: '更新照片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '照片信息更新成功' })
  async updateAlbumPhoto(
    @Body() body: UpdateAlbumPhotoDto,
  ): Promise<ResultData<UpdateAlbumPhotoResultDto | null>> {
    try {
      this.logger.log(
        `开始更新相册照片ID: ${body.id}, 相册ID: ${body.albumId}`,
      );
      const result = await this.photoService.updateAlbumPhoto(body);
      if (!result) {
        this.logger.warn(`更新相册照片失败：未找到ID为 ${body.id} 的照片`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        });
      }

      this.logger.log(
        `成功更新相册照片，照片ID: ${result.id}, 相册ID: ${result.albumId}`,
      );
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      });
    } catch (error) {
      this.logger.error('更新相册照片失败', error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除照片' })
  @ApiParam({ name: 'id', description: '照片ID' })
  @ApiResponse({ status: 200, description: '照片删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的照片`);

      await this.prisma.photo.delete({
        where: { id: Number(id) },
      });

      this.logger.log(`成功删除ID为 ${id} 的照片`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`删除ID为 ${id} 的照片失败`, error);
      throw error;
    }
  }
}
