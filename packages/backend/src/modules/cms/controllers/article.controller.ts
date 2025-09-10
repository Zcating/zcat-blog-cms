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

import { PrismaService } from '@backend/core';
import { createResult, ResultCode, ResultData } from '@backend/model';
import { Article } from '@backend/prisma';

import { CreateArticleDto, UpdateArticleDto, ReturnArticleDto } from '../dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

@ApiTags('文章管理')
@Controller('api/cms/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  private readonly logger = new Logger(ArticleController.name);

  constructor(private prismaService: PrismaService) {}

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

      const articles = await this.prismaService.article.findMany({
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          updatedAt: true,
          createByUserId: true,
          articleAndArticleTags: {
            select: {
              articleTag: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
      this.logger.log(`成功获取 ${articles.length} 篇文章`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: articles.map((article) => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          tags: article.articleAndArticleTags.map((item) => item.articleTag),
        })),
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
      const article = await this.prismaService.article.findUnique({
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

      const article = await this.prismaService.article.create({
        data: createArticleDto,
      });

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
      const result = await this.prismaService.article.update({
        where: { id: parseInt(id) },
        data: updateArticleDto,
      });
      if (!result) {
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
      const result = await this.prismaService.article.delete({
        where: { id: parseInt(id) },
      });
      if (!result) {
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
