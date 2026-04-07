import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ArticleController } from '../features/article/article.controller';
import { ArticleService } from '../features/article/article.service';
import { ArticleTagController } from '../features/article-tag/article-tag.controller';
import { ArticleTagService } from '../features/article-tag/article-tag.service';
import { PhotoController } from '../features/photo/photo.controller';
import { PhotoService } from '../features/photo/photo.service';
import { PhotoAlbumController } from '../features/photo-album/photo-album.controller';
import { PhotoAlbumService } from '../features/photo-album/photo-album.service';
import { StatisticsController } from '../features/statistics/statistics.controller';
import { StatisticsService } from '../features/statistics/statistics.service';
import { SystemSettingController } from '../features/system-setting/system-setting.controller';
import { SystemSettingService } from '../features/system-setting/system-setting.service';
import { UserInfoController } from '../features/user-info/user-info.controller';
import { UserInfoService } from '../features/user-info/user-info.service';

//
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [
    ArticleController,
    ArticleTagController,
    PhotoController,
    PhotoAlbumController,
    SystemSettingController,
    StatisticsController,
    UserInfoController,
  ],
  providers: [
    PhotoService,
    PhotoAlbumService,
    ArticleService,
    ArticleTagService,
    StatisticsService,
    SystemSettingService,
    UserInfoService,
  ],
})
export class CmsModule {}
