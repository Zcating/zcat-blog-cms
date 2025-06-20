import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArticleTag } from '../../table/article-tag.entity';
import { Article } from '../../table/article.entity';
import { PhotoAlbum } from '../../table/photo-album.entity';
import { Photo } from '../../table/photo.entity';

import { ArticleTagController } from './article-tag.controller';
import { ArticleController } from './article.controller';
import { PhotoAlbumController } from './photo-album.controller';
import { PhotoController } from './photo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleTag, Photo, PhotoAlbum])],
  controllers: [
    ArticleController,
    ArticleTagController,
    PhotoController,
    PhotoAlbumController,
  ],
})
export class CmsModule {}
