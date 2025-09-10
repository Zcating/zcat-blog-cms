import { Global, Module } from '@nestjs/common';

import { OssService } from './oss.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [OssService, PrismaService],
  exports: [OssService, PrismaService],
})
export class CoreModule {}
