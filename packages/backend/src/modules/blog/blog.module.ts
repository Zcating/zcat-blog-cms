import { Module } from '@nestjs/common';

import { PrismaService } from '@backend/prisma.service';

import { BlogController } from './controllers/blog-controller';

//
@Module({
  controllers: [BlogController],
  providers: [PrismaService],
})
export class BlogModule {}
