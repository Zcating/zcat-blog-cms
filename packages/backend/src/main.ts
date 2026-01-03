import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const allowedOrigins = [
    configService.get('FRONTEND_URL') ?? '',
    configService.get('BLOG_URL') ?? '',
  ];
  const nodeEnv: string = configService.get('NODE_ENV') || 'develop';

  // 配置CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (nodeEnv === 'develop') {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Data-Hash'],
    credentials: true,
  });

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );

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
