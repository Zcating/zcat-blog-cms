import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  Article,
  ArticleTag,
  Photo,
  PhotoAlbum,
  User,
  UserInfo,
} from '@backend/table';

import { ArticleTagController } from './article-tag.controller';
import { ArticleController } from './article.controller';
import { PhotoAlbumController } from './photo-album.controller';
import { PhotoController } from './photo.controller';
import { PhotoService } from './services/photo.service';

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
  providers: [PhotoService],
})
export class CmsModule {}
