import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, ResultData } from '@backend/model';

import { Repository } from 'typeorm';

import { PhotoAlbum } from '../../../table/photo-album.entity';
import { CreatePhotoAlbumDto, UpdateAlbumDto } from '../dto';
import { SetCoverDto } from '../dto/set-cover.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

@ApiTags('相册管理')
@Controller('api/cms/photo-albums')
@UseGuards(JwtAuthGuard)
export class PhotoAlbumController {
  private readonly logger = new Logger(PhotoAlbumController.name);

  constructor(
    @InjectRepository(PhotoAlbum)
    private photoAlbumRepository: Repository<PhotoAlbum>,
  ) {}

  /**
   * 获取所有相册
   * @returns 相册列表
   */
  @Get()
  @ApiOperation({ summary: '获取所有相册' })
  @ApiResponse({ status: 200, description: '成功获取相册列表' })
  async findAll(): Promise<ResultData<PhotoAlbum[]>> {
    try {
      this.logger.log('开始获取所有相册');
      const albums = await this.photoAlbumRepository.find({
        relations: ['cover'],
      });
      this.logger.log(`成功获取 ${albums.length} 个相册`);
      return createResult({
        code: '0000',
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
      const album = await this.photoAlbumRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['cover'],
      });
      this.logger.log(`${album ? '成功' : '未找到'}获取ID为 ${id} 的相册`);
      return createResult({
        code: '0000',
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
      const album = await this.photoAlbumRepository.save(createPhotoAlbumDto);
      this.logger.log(`成功创建相册，ID: ${album.id}, 名称: ${album.name}`);
      return createResult({
        code: '0000',
        message: '成功',
        data: album,
      });
    } catch (error) {
      this.logger.error('创建相册失败', error);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: '更新相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updatePhotoAlbumDto: UpdateAlbumDto,
  ): Promise<ResultData<void>> {
    try {
      this.logger.log(
        `开始更新ID为 ${id} 的相册: ${updatePhotoAlbumDto.name || '未提供名称'}`,
      );
      const result = await this.photoAlbumRepository.update(
        id,
        updatePhotoAlbumDto,
      );
      if (result.affected === 0) {
        this.logger.warn(`更新ID为 ${id} 的相册失败：未找到记录`);
        return createResult({
          code: 'ERR0003',
          message: '更新失败',
        });
      }
      this.logger.log(`成功更新ID为 ${id} 的相册`);
      return createResult({
        code: '0000',
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`更新ID为 ${id} 的相册失败`, error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的相册`);
      const result = await this.photoAlbumRepository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`删除ID为 ${id} 的相册失败：未找到记录`);
        return createResult({
          code: 'ERR0003',
          message: '删除失败',
        });
      }
      this.logger.log(`成功删除ID为 ${id} 的相册`);
      return createResult({
        code: '0000',
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
      const result = await this.photoAlbumRepository.update(
        setCoverDto.albumId,
        {
          cover: {
            id: setCoverDto.photoId,
          },
        },
      );
      if (result.affected === 0) {
        this.logger.warn(
          `设置ID为 ${setCoverDto.albumId} 的相册封面失败：未找到记录`,
        );
        return createResult({
          code: 'ERR0003',
          message: '设置失败',
        });
      }
      this.logger.log(`成功设置ID为 ${setCoverDto.albumId} 的相册封面`);
      return createResult({
        code: '0000',
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
}
