import { Module } from '@nestjs/common';

import { BlogController } from '../features/blog/blog.controller';
import { BlogService } from '../features/blog/blog.service';

//
@Module({
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
