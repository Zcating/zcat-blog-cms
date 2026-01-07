import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { PrismaService } from '@backend/common';
import {
  createResult,
  PaginateQueryDto,
  PaginateResult,
  ResultCode,
  ResultData,
} from '@backend/model';
import { Article } from '@backend/prisma';

import { JwtAuthGuard } from '../jwt-auth.guard';
import {
  CreateArticleDto,
  ReturnArticleDto,
  UpdateArticleDto,
} from '../schemas';
import { ArticleService } from '../services/article.service';

@ApiTags('文章管理')
@Controller('api/cms/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  private readonly logger = new Logger(ArticleController.name);

  constructor(
    private prismaService: PrismaService,
    private articleService: ArticleService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有文章' })
  @ApiResponse({
    status: 200,
    description: '成功获取文章列表',
  })
  async findAll(
    @Query() dto: PaginateQueryDto,
  ): Promise<ResultData<PaginateResult<ReturnArticleDto>>> {
    try {
      this.logger.log('开始获取所有文章');

      const pagination = await this.articleService.findArticles(dto);

      this.logger.log(`成功获取 ${pagination.data.length} 篇文章`);

      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: pagination,
      });
    } catch (error) {
      this.logger.error('获取文章列表失败', error);
      throw error;
    }
  }

  @Get('detail')
  @ApiOperation({ summary: '根据ID获取文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '成功获取文章详情' })
  async findOne(@Query('id') id: string): Promise<ResultData<Article | null>> {
    try {
      this.logger.log(`开始获取ID为 ${id} 的文章`);

      const article = await this.articleService.getArticle(id);

      if (!article) {
        this.logger.warn(`未找到ID为 ${id} 的文章`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '未找到文章',
        });
      }

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

  @Post('create')
  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  async create(
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ResultData<Article>> {
    try {
      this.logger.log(`开始创建文章: ${createArticleDto.title}`);

      const article = await this.articleService.createArticle(createArticleDto);

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

  @Post('update')
  @ApiOperation({ summary: '更新文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章更新成功' })
  async update(
    @Body() dto: UpdateArticleDto,
  ): Promise<ResultData<Article | void>> {
    try {
      this.logger.log(
        `开始更新ID为 ${dto.id} 的文章: ${dto.title || '未提供标题'}`,
      );
      const result = await this.articleService.updateArticle(dto);

      if (!result) {
        this.logger.warn(`更新ID为 ${dto.id} 的文章失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        });
      }

      this.logger.log(`成功更新ID为 ${dto.id} 的文章`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      });
    } catch (error) {
      this.logger.error(`更新ID为 ${dto.id} 的文章失败`, error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '更新失败',
      });
    }
  }

  @Post('delete')
  @ApiOperation({ summary: '删除文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章删除成功' })
  async remove(@Body('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的文章`);

      const result = await this.articleService.removeArticle(id);

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

  @Post('upload-images')
  @ApiOperation({ summary: '上传文章图片' })
  @ApiResponse({ status: 200, description: '图片上传成功' })
  uploadImages(@Body('images') images: string[] = []): ResultData<string[]> {
    try {
      this.logger.log(`开始上传 ${images.length} 张文章图片`);

      const urls = this.articleService.uploadArticleImages(images);

      this.logger.log(`成功上传 ${urls.length} 张文章图片`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: urls,
      });
    } catch (error) {
      this.logger.error('上传文章图片失败', error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '上传失败',
      });
    }
  }
}
