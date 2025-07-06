import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, ResultData } from '@backend/model';

import { Repository } from 'typeorm';

import { PhotoAlbum } from '../../table/photo-album.entity';

import { CreatePhotoAlbumDto, UpdatePhotoAlbumDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('相册管理')
@Controller('api/cms/photo-albums')
@UseGuards(JwtAuthGuard)
export class PhotoAlbumController {
  constructor(
    @InjectRepository(PhotoAlbum)
    private photoAlbumRepository: Repository<PhotoAlbum>,
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
    @Body() updatePhotoAlbumDto: UpdatePhotoAlbumDto,
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
}
