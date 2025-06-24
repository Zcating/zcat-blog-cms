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

import { ArticleTag } from '../../table/article-tag.entity';

import { CreateArticleTagDto, UpdateArticleTagDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('文章标签管理')
@Controller('api/cms/article-tags')
@UseGuards(JwtAuthGuard)
export class ArticleTagController {
  constructor(
    @InjectRepository(ArticleTag)
    private articleTagRepository: Repository<ArticleTag>,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有文章标签' })
  @ApiResponse({ status: 200, description: '成功获取标签列表' })
  async findAll(): Promise<ResultData<ArticleTag[]>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleTagRepository.find(),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '成功获取标签详情' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResultData<ArticleTag | null>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleTagRepository.findOne({
        where: { id: parseInt(id) },
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: '创建文章标签' })
  @ApiResponse({ status: 201, description: '标签创建成功' })
  async create(
    @Body() createArticleTagDto: CreateArticleTagDto,
  ): Promise<ResultData<ArticleTag>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleTagRepository.save(createArticleTagDto),
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '标签更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleTagDto: UpdateArticleTagDto,
  ): Promise<ResultData<void>> {
    const result = await this.articleTagRepository.update(
      id,
      updateArticleTagDto,
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
  @ApiOperation({ summary: '删除文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '标签删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    const result = await this.articleTagRepository.delete(id);
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
