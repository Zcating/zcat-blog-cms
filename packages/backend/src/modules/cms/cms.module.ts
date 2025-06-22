import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArticleTagController } from './article-tag.controller';
import { ArticleController } from './article.controller';
import { PhotoAlbumController } from './photo-album.controller';
import { PhotoController } from './photo.controller';
import {
  Article,
  ArticleTag,
  Photo,
  PhotoAlbum,
  User,
  UserInfo,
} from '@backend/table';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';

//
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([
      Article,
      ArticleTag,
      Photo,
      PhotoAlbum,
      UserInfo,
      User,
    ]),
  ],
  controllers: [
    ArticleController,
    ArticleTagController,
    PhotoController,
    PhotoAlbumController,
  ],
})
export class CmsModule {}
