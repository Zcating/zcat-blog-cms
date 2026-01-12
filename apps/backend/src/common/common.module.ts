import { Global, Module } from '@nestjs/common';

import { OssService } from './oss.service';
import { PrismaService } from './prisma.service';
import { StatisticService } from './statistic-service';

@Global()
@Module({
  providers: [OssService, PrismaService, StatisticService],
  exports: [OssService, PrismaService, StatisticService],
})
export class CommonModule {}
