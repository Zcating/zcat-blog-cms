import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ServeStaticModule } from '@nestjs/serve-static';

import { CommonModule } from '@backend/common';
import { AuthModule, BlogModule, CmsModule } from '@backend/modules';

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
})
export class AppModule {}
