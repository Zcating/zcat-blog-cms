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
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, ResultCode, ResultData } from '@backend/model';
import { ImageInterceptor } from '@backend/utils';

import { Repository } from 'typeorm';

import { Photo } from '../../../table/photo.entity';
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
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
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

      const photos = await this.photoRepository.find({
        where: albumId > 0 ? { album: { id: albumId } } : undefined,
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
      const photo = await this.photoRepository.findOne({
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
  @UseInterceptors(ImageInterceptor('image'))
  async create(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: CreatePhotoDto,
  ): Promise<ResultData<Photo>> {
    try {
      this.logger.log(`开始创建照片: ${body.name || '未提供名称'}`);
      const photo = await this.photoService.createPhoto(image, body);
      // 如果有文件上传，使用文件信息
      if (!photo) {
        // 如果没有文件上传，返回错误
        this.logger.warn('创建照片失败：未选择文件');
        return createResult({
          code: ResultCode.UploadError,
          message: '请选择要上传的文件',
        });
      }

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
  @UseInterceptors(ImageInterceptor('image'))
  async createAlbumPhoto(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: CreateAlbumPhotoDto,
  ): Promise<ResultData<Photo>> {
    try {
      this.logger.log(`开始创建相册照片: ${body.name || '未提供名称'}`);
      const photo = await this.photoService.createAlbumPhoto(image, body);
      // 如果有文件上传，使用文件信息
      if (!photo) {
        // 如果没有文件上传，返回错误
        this.logger.warn('创建相册照片失败：未选择文件');
        return createResult({
          code: ResultCode.UploadError,
          message: '请选择要上传的文件',
        });
      }

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
  @UseInterceptors(ImageInterceptor('image'))
  async update(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: UpdatePhotoDto,
  ): Promise<ResultData<Photo | null>> {
    try {
      this.logger.log(
        `开始更新照片ID: ${body.id}, 名称: ${body.name || '未提供名称'}`,
      );
      const photo = await this.photoService.updatePhoto(image, body);
      if (!photo) {
        this.logger.warn(`更新照片失败：未找到ID为 ${body.id} 的照片`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        });
      }

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
  @UseInterceptors(ImageInterceptor('image'))
  async updateAlbumPhoto(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: UpdateAlbumPhotoDto,
  ): Promise<ResultData<UpdateAlbumPhotoResultDto | null>> {
    try {
      this.logger.log(
        `开始更新相册照片ID: ${body.id}, 相册ID: ${body.albumId}`,
      );
      const result = await this.photoService.updateAlbumPhoto(image, body);
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
      const result = await this.photoRepository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`删除ID为 ${id} 的照片失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '删除失败',
        });
      }
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
