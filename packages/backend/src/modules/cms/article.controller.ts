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

import { Article } from '../../table/article.entity';

import { CreateArticleDto, UpdateArticleDto, ReturnArticleDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('文章管理')
@Controller('api/cms/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有文章' })
  @ApiResponse({
    status: 200,
    description: '成功获取文章列表',
    type: [ReturnArticleDto],
  })
  async findAll(): Promise<ResultData<ReturnArticleDto[]>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleRepository.find({
        select: ['id', 'title', 'excerpt', 'createdAt', 'updatedAt'],
        relations: ['createByUser', 'tags'],
      }),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '成功获取文章详情' })
  async findOne(@Param('id') id: string): Promise<ResultData<Article | null>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleRepository.findOne({
        where: { id: parseInt(id) },
      }),
    });
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  async create(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ResultData<Article>> {
    return createResult({
      code: '0000',
      message: '成功',
      data: await this.articleRepository.save(createArticleDto),
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ResultData<void>> {
    const result = await this.articleRepository.update(id, updateArticleDto);
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
  @ApiOperation({ summary: '删除文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    const result = await this.articleRepository.delete(id);
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
}
