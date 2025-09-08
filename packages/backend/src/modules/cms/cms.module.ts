import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PrismaService } from '@backend/prisma.service';

import { SystemSettingController } from './controllers';
import { ArticleTagController } from './controllers/article-tag.controller';
import { ArticleController } from './controllers/article.controller';
import { PhotoAlbumController } from './controllers/photo-album.controller';
import { PhotoController } from './controllers/photo.controller';
import { PhotoService } from './services/photo.service';

//
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [
    ArticleController,
    ArticleTagController,
    PhotoController,
    PhotoAlbumController,
    SystemSettingController,
  ],
  providers: [PhotoService, PrismaService],
})
export class CmsModule {}
