import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

export const prismaService = new PrismaClient({ adapter });

// 初始化数据库连接
prismaService.$connect();
