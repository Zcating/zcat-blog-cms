import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { CommonModule, HttpExceptionFilter } from '@backend/common';
import { AuthModule, BlogModule, CmsModule } from '@backend/modules';

import { ZodValidationPipe } from 'nestjs-zod';

// import * as path from 'path';

// import * as path from 'path';

@Module({
  imports: [
    // 配置模块 - 必须放在最前面
    ConfigModule.forRoot({
      // 使配置在整个应用中全局可用
      isGlobal: true,
      // 按优先级加载环境文件
      envFilePath: [
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
      ],
    }),
    CommonModule,
    // ServeStaticModule.forRoot({
    //   rootPath: path.join(__dirname, '..', 'uploads/'),
    // }),
    AuthModule,
    CmsModule,
    BlogModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
