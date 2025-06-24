import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule, CmsModule } from '@backend/modules';

import path from 'path';

@Module({
  imports: [
    // 配置模块 - 必须放在最前面
    ConfigModule.forRoot({
      // 使配置在整个应用中全局可用
      isGlobal: true,
      // 按优先级加载环境文件
      envFilePath: [
        '.env.local',
        '.env.development',
        '.env.production',
        '.env',
      ],
    }),
    // 使用环境变量配置数据库
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        synchronize: configService.get('DB_SYNCHRONIZE'),
        autoLoadEntities: true,
        entities: [`${__dirname}/src/table/*{.ts,.js}`],
        migrations: [`${__dirname}/src/migration/*{.ts,.js}`],
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', '/uploads/public'),
      renderPath: 'public',
    }),
    AuthModule,
    CmsModule,
  ],
})
export class AppModule {}
