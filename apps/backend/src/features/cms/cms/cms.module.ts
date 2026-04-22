import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ArticleController } from '../article/article.controller';
import { ArticleService } from '../article/article.service';
import { ArticleTagController } from '../article-tag/article-tag.controller';
import { ArticleTagService } from '../article-tag/article-tag.service';
import { JwtStrategy } from '../auth/auth-jwt.strategy';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { PhotoController } from '../photo/photo.controller';
import { PhotoService } from '../photo/photo.service';
import { PhotoAlbumController } from '../photo-album/photo-album.controller';
import { PhotoAlbumService } from '../photo-album/photo-album.service';
import { StatisticsController } from '../statistics/statistics.controller';
import { StatisticsService } from '../statistics/statistics.service';
import { SystemSettingController } from '../system-setting/system-setting.controller';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { UserInfoController } from '../user-info/user-info.controller';
import { UserInfoService } from '../user-info/user-info.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    ArticleController,
    ArticleTagController,
    PhotoController,
    PhotoAlbumController,
    SystemSettingController,
    StatisticsController,
    UserInfoController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
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
