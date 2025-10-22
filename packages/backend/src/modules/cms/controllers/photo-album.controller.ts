import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { PrismaService } from '@backend/common';
import { createResult, ResultCode, ResultData } from '@backend/model';
import { PhotoAlbum } from '@backend/prisma';

import { CreatePhotoAlbumDto, UpdateAlbumDto } from '../dto';
import { AddPhotosDto } from '../dto/add-photos.dto';
import { ReturnPhotoAlbumDto } from '../dto/return-photo-album.dto';
import { SetCoverDto } from '../dto/set-cover.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { PhotoService } from '../services/photo.service';

@ApiTags('相册管理')
@Controller('api/cms/photo-albums')
@UseGuards(JwtAuthGuard)
export class PhotoAlbumController {
  private readonly logger = new Logger(PhotoAlbumController.name);

  constructor(
    private prismaService: PrismaService,
    private photoService: PhotoService,
  ) {}

  /**
   * 获取所有相册
   * @returns 相册列表
   */
  @Get()
  @ApiOperation({ summary: '获取所有相册' })
  @ApiResponse({ status: 200, description: '成功获取相册列表' })
  async findAll(): Promise<ResultData<ReturnPhotoAlbumDto[]>> {
    try {
      this.logger.log('开始获取所有相册');
      const albums = await this.photoService.getAlbums();

      this.logger.log(`成功获取 ${albums.length} 个相册`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: albums,
      });
    } catch (error) {
      this.logger.error('获取相册列表失败', error);
      throw error;
    }
  }

  /**
   * 根据ID获取相册详情
   * @param id 相册ID
   * @returns 相册详情
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '成功获取相册详情' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResultData<PhotoAlbum | null>> {
    try {
      this.logger.log(`开始获取ID为 ${id} 的相册`);

      const album = await this.prismaService.photoAlbum.findUnique({
        where: { id: parseInt(id) },
      });

      this.logger.log(`${album ? '成功' : '未找到'}获取ID为 ${id} 的相册`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: album,
      });
    } catch (error) {
      this.logger.error(`获取ID为 ${id} 的相册失败`, error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: '创建相册' })
  @ApiResponse({ status: 200, description: '相册创建成功' })
  async create(
    @Body() createPhotoAlbumDto: CreatePhotoAlbumDto,
  ): Promise<ResultData<PhotoAlbum>> {
    try {
      this.logger.log(`开始创建相册: ${createPhotoAlbumDto.name}`);

      const album = await this.prismaService.photoAlbum.create({
        data: createPhotoAlbumDto,
      });

      this.logger.log(`成功创建相册，ID: ${album.id}, 名称: ${album.name}`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: album,
      });
    } catch (error) {
      this.logger.error('创建相册失败', error);
      throw error;
    }
  }

  /**
   * 更新相册
   * @param id 相册ID
   * @param updatePhotoAlbumDto 更新相册DTO
   * @returns
   */
  @Post('update')
  @ApiOperation({ summary: '更新相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册更新成功' })
  async update(
    @Body() dto: UpdateAlbumDto,
  ): Promise<ResultData<PhotoAlbum | null>> {
    try {
      this.logger.log(
        `开始更新ID为 ${dto.id} 的相册: ${dto.name || '未提供名称'}`,
      );

      const result = await this.prismaService.photoAlbum.update({
        where: { id: dto.id },
        data: dto,
      });

      this.logger.log(`成功更新ID为 ${dto.id} 的相册`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      });
    } catch (error) {
      this.logger.error(`更新ID为 ${dto.id} 的相册失败`, error);
      throw error;
    }
  }

  @Post('delete')
  @ApiOperation({ summary: '删除相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册删除成功' })
  async remove(@Body('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的相册`);

      await this.prismaService.photoAlbum.delete({
        where: { id: parseInt(id) },
      });

      this.logger.log(`成功删除ID为 ${id} 的相册`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`删除ID为 ${id} 的相册失败`, error);
      throw error;
    }
  }

  @Post('cover')
  @ApiOperation({ summary: '设置相册封面' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setCover(@Body() setCoverDto: SetCoverDto): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始设置ID为 ${setCoverDto.albumId} 的相册封面`);

      await this.prismaService.photoAlbum.update({
        where: { id: setCoverDto.albumId },
        data: {
          coverId: setCoverDto.photoId,
        },
      });

      this.logger.log(`成功设置ID为 ${setCoverDto.albumId} 的相册封面`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(
        `设置ID为 ${setCoverDto.albumId} 的相册封面失败`,
        error,
      );
      throw error;
    }
  }

  @Post('add-photos')
  @ApiOperation({ summary: '批量添加照片到相册' })
  @ApiResponse({ status: 200, description: '批量添加成功' })
  async batchAddPhotos(
    @Body() batchAddDto: AddPhotosDto,
  ): Promise<ResultData<void>> {
    try {
      this.logger.log(
        `开始批量添加 ${batchAddDto.photoIds.length} 张照片到相册 ${batchAddDto.albumId}`,
      );

      // 验证相册是否存在
      const album = await this.prismaService.photoAlbum.findUnique({
        where: { id: batchAddDto.albumId },
      });

      if (!album) {
        this.logger.warn(`相册 ${batchAddDto.albumId} 不存在`);
        return createResult({
          code: ResultCode.ValidationError,
          message: '相册不存在',
        });
      }

      // 批量更新照片的相册归属
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

      this.logger.log(
        `成功批量添加 ${batchAddDto.photoIds.length} 张照片到相册 ${batchAddDto.albumId}`,
      );

      return createResult({
        code: ResultCode.Success,
        message: '批量添加照片到相册成功',
      });
    } catch (error) {
      this.logger.error(
        `批量添加照片到相册 ${batchAddDto.albumId} 失败`,
        error,
      );
      throw error;
    }
  }
}
