import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Article, ArticleTag, Photo, PhotoAlbum } from '@backend/table';

import { BlogController } from './controllers/blog-controller';

//
@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleTag, Photo, PhotoAlbum])],
  controllers: [BlogController],
})
export class BlogModule {}
