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

import { Photo } from '../../table/photo.entity';

import { CreatePhotoDto, UpdatePhotoDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('照片管理')
@Controller('api/cms/photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
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
  @ApiResponse({ status: 201, description: '照片创建成功' })
  async create(
    @Body() createPhotoDto: CreatePhotoDto,
  ): Promise<ResultData<Photo>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.photoRepository.save(createPhotoDto),
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
