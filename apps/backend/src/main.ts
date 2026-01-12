import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // 配置CORS
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') ?? '',
      configService.get('BLOG_URL') ?? '',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Data-Hash'],
    credentials: true,
  });

  // 配置解析器的最大大小
  app.useBodyParser('json', { limit: '10mb' });

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
  await app.listen(configService.get('PORT') ?? 9090);
}

bootstrap();
