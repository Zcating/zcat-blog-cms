import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client';

import { config } from './config.service';

const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
});

export const prismaService = new PrismaClient({ adapter });

// 初始化数据库连接
prismaService.$connect();
