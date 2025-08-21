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

import { createResult, ResultCode, ResultData } from '@backend/model';

import { Repository } from 'typeorm';

import { Article } from '../../../table/article.entity';
import { CreateArticleDto, UpdateArticleDto, ReturnArticleDto } from '../dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

@ApiTags('文章管理')
@Controller('api/cms/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  private readonly logger = new Logger(ArticleController.name);

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
    try {
      this.logger.log('开始获取所有文章');
      const articles = await this.articleRepository.find({
        select: ['id', 'title', 'excerpt', 'createdAt', 'updatedAt'],
        relations: ['createByUser', 'tags'],
      });
      this.logger.log(`成功获取 ${articles.length} 篇文章`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: articles,
      });
    } catch (error) {
      this.logger.error('获取文章列表失败', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '成功获取文章详情' })
  async findOne(@Param('id') id: string): Promise<ResultData<Article | null>> {
    try {
      this.logger.log(`开始获取ID为 ${id} 的文章`);
      const article = await this.articleRepository.findOne({
        where: { id: parseInt(id) },
      });
      this.logger.log(`${article ? '成功' : '未找到'}获取ID为 ${id} 的文章`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: article,
      });
    } catch (error) {
      this.logger.error(`获取ID为 ${id} 的文章失败`, error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  async create(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ResultData<Article>> {
    try {
      this.logger.log(`开始创建文章: ${createArticleDto.title}`);
      const article = await this.articleRepository.save(createArticleDto);
      this.logger.log(
        `成功创建文章，ID: ${article.id}, 标题: ${article.title}`,
      );
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: article,
      });
    } catch (error) {
      this.logger.error('创建文章失败', error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '创建失败',
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ResultData<void>> {
    try {
      this.logger.log(
        `开始更新ID为 ${id} 的文章: ${updateArticleDto.title || '未提供标题'}`,
      );
      const result = await this.articleRepository.update(id, updateArticleDto);
      if (result.affected === 0) {
        this.logger.warn(`更新ID为 ${id} 的文章失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        });
      }
      this.logger.log(`成功更新ID为 ${id} 的文章`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`更新ID为 ${id} 的文章失败`, error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '更新失败',
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的文章`);
      const result = await this.articleRepository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`删除ID为 ${id} 的文章失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '删除失败',
        });
      }
      this.logger.log(`成功删除ID为 ${id} 的文章`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`删除ID为 ${id} 的文章失败`, error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '删除失败',
      });
    }
  }
}
