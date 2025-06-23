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

import { Article } from '../../table/article.entity';

import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/cms/articles')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  @Get()
  async findAll(): Promise<Article[]> {
    return this.articleRepository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Article | null> {
    return this.articleRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Post()
  async create(@Body() article: Article): Promise<Article> {
    return this.articleRepository.save(article);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() article: Article,
  ): Promise<Article | null> {
    await this.articleRepository.update(id, article);
    return this.articleRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.articleRepository.delete(id);
  }
}
