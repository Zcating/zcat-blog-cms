import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // 配置解析器的最大大小
  app.useBodyParser('json', { limit: '10mb' });

  // 配置静态文件服务
  app.useStaticAssets(join(__dirname, '../', 'uploads'), {
    prefix: '/static/uploads/',
  });

  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('cms 后台管理系统')
    .setDescription('cms 后台管理系统 API 描述')
    .setVersion('1.0')
    .addTag('cms')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // 启动应用
  await app.listen(configService.get('PORT') ?? 3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
