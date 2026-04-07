import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import {
  createResult,
  PaginateQueryDto,
  PaginateResult,
  ResultCode,
  ResultData,
} from '@backend/model';
import { PhotoAlbum } from '@backend/prisma';

import { CmsJwtAuthGuard } from '../cms/cms-jwt-auth.guard';
import { AddPhotosDto } from '../photo/photo.schema';

import {
  ReturnPhotoAlbumDto,
  CreatePhotoAlbumDto,
  SetCoverDto,
  UpdateAlbumDto,
} from './photo-album.schema';
import { PhotoAlbumService } from './photo-album.service';

@ApiTags('相册管理')
@Controller('api/cms/photo-albums')
@UseGuards(CmsJwtAuthGuard)
export class PhotoAlbumController {
  private readonly logger = new Logger(PhotoAlbumController.name);

  constructor(private photoAlbumService: PhotoAlbumService) {}

  @Get()
  @ApiOperation({ summary: '获取所有相册' })
  @ApiResponse({ status: 200, description: '成功获取相册列表' })
  async findAll(
    @Query() dto: PaginateQueryDto,
  ): Promise<ResultData<PaginateResult<ReturnPhotoAlbumDto>>> {
    this.logger.log('开始获取所有相册');
    const result = await this.photoAlbumService.findAll(dto);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: result,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '成功获取相册详情' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResultData<PhotoAlbum | null>> {
    const album = await this.photoAlbumService.findOne(id);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: album,
    });
  }

  @Post()
  @ApiOperation({ summary: '创建相册' })
  @ApiResponse({ status: 200, description: '相册创建成功' })
  async create(
    @Body() createPhotoAlbumDto: CreatePhotoAlbumDto,
  ): Promise<ResultData<PhotoAlbum>> {
    const album = await this.photoAlbumService.create(createPhotoAlbumDto);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: album,
    });
  }

  @Post('update')
  @ApiOperation({ summary: '更新相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册更新成功' })
  async update(
    @Body() dto: UpdateAlbumDto,
  ): Promise<ResultData<PhotoAlbum | null>> {
    const result = await this.photoAlbumService.update(dto);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
      data: result,
    });
  }

  @Post('delete')
  @ApiOperation({ summary: '删除相册' })
  @ApiParam({ name: 'id', description: '相册ID' })
  @ApiResponse({ status: 200, description: '相册删除成功' })
  async remove(@Body('id') id: string): Promise<ResultData<void>> {
    await this.photoAlbumService.remove(id);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
    });
  }

  @Post('cover')
  async setCover(@Body() setCoverDto: SetCoverDto): Promise<ResultData<void>> {
    await this.photoAlbumService.setCover(setCoverDto);
    return createResult({
      code: ResultCode.Success,
      message: '成功',
    });
  }

  @Post('add-photos')
  async batchAddPhotos(
    @Body() batchAddDto: AddPhotosDto,
  ): Promise<ResultData<void>> {
    const success = await this.photoAlbumService.batchAddPhotos(batchAddDto);
    if (!success) {
      return createResult({
        code: ResultCode.ValidationError,
        message: '相册不存在',
      });
    }

    return createResult({
      code: ResultCode.Success,
      message: '批量添加照片到相册成功',
    });
  }
}
