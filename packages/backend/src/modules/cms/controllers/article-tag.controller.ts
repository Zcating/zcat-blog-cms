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

import { ArticleTag } from '../../../table/article-tag.entity';
import { CreateArticleTagDto, UpdateArticleTagDto } from '../dto';
import { JwtAuthGuard } from '../jwt-auth.guard';

@ApiTags('文章标签管理')
@Controller('api/cms/article-tags')
@UseGuards(JwtAuthGuard)
export class ArticleTagController {
  private readonly logger = new Logger(ArticleTagController.name);

  constructor(
    @InjectRepository(ArticleTag)
    private articleTagRepository: Repository<ArticleTag>,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有文章标签' })
  @ApiResponse({ status: 200, description: '成功获取标签列表' })
  async findAll(): Promise<ResultData<ArticleTag[]>> {
    try {
      this.logger.log('开始获取所有文章标签');
      const tags = await this.articleTagRepository.find();
      this.logger.log(`成功获取 ${tags.length} 个文章标签`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: tags,
      });
    } catch (error: any) {
      this.logger.error('获取文章标签失败', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '成功获取标签详情' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResultData<ArticleTag | null>> {
    try {
      this.logger.log(`开始获取ID为 ${id} 的文章标签`);
      const tag = await this.articleTagRepository.findOne({
        where: { id: parseInt(id) },
      });
      this.logger.log(`${tag ? '成功' : '未找到'}获取ID为 ${id} 的文章标签`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: tag,
      });
    } catch (error) {
      this.logger.error(`获取ID为 ${id} 的文章标签失败`);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: '创建文章标签' })
  @ApiResponse({ status: 201, description: '标签创建成功' })
  async create(
    @Body() createArticleTagDto: CreateArticleTagDto,
  ): Promise<ResultData<ArticleTag>> {
    try {
      this.logger.log(
        `开始创建文章标签: ${JSON.stringify(createArticleTagDto)}`,
      );
      const tag = await this.articleTagRepository.save(createArticleTagDto);
      this.logger.log(`成功创建文章标签，ID: ${tag.id}`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
        data: tag,
      });
    } catch (error: any) {
      this.logger.error('创建文章标签失败', error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '创建失败',
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '标签更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleTagDto: UpdateArticleTagDto,
  ): Promise<ResultData<void>> {
    try {
      this.logger.log(
        `开始更新ID为 ${id} 的文章标签: ${JSON.stringify(updateArticleTagDto)}`,
      );
      const result = await this.articleTagRepository.update(
        id,
        updateArticleTagDto,
      );
      if (result.affected === 0) {
        this.logger.warn(`更新ID为 ${id} 的文章标签失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        });
      }
      this.logger.log(`成功更新ID为 ${id} 的文章标签`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`更新ID为 ${id} 的文章标签失败`, error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '更新失败',
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章标签' })
  @ApiParam({ name: 'id', description: '标签ID' })
  @ApiResponse({ status: 200, description: '标签删除成功' })
  async remove(@Param('id') id: string): Promise<ResultData<void>> {
    try {
      this.logger.log(`开始删除ID为 ${id} 的文章标签`);
      const result = await this.articleTagRepository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`删除ID为 ${id} 的文章标签失败：未找到记录`);
        return createResult({
          code: ResultCode.DatabaseError,
          message: '删除失败',
        });
      }
      this.logger.log(`成功删除ID为 ${id} 的文章标签`);
      return createResult({
        code: ResultCode.Success,
        message: '成功',
      });
    } catch (error) {
      this.logger.error(`删除ID为 ${id} 的文章标签失败`, error);
      return createResult({
        code: ResultCode.UnknownError,
        message: '删除失败',
      });
    }
  }
}
