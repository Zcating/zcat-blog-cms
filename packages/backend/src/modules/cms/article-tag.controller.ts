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
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ArticleTag } from '../../table/article-tag.entity';

import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/cms/article-tags')
@UseGuards(JwtAuthGuard)
export class ArticleTagController {
  constructor(
    @InjectRepository(ArticleTag)
    private articleTagRepository: Repository<ArticleTag>,
  ) {}

  @Get()
  async findAll(): Promise<ArticleTag[]> {
    return this.articleTagRepository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ArticleTag | null> {
    return this.articleTagRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Post()
  async create(@Body() articleTag: ArticleTag): Promise<ArticleTag> {
    return this.articleTagRepository.save(articleTag);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() articleTag: ArticleTag,
  ): Promise<ArticleTag | null> {
    await this.articleTagRepository.update(id, articleTag);
    return this.articleTagRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.articleTagRepository.delete(id);
  }
}
