import { PrismaService, OssService } from '@backend/common';

export const prismaService = new PrismaService();
prismaService.onModuleInit();

export const ossService = new OssService();
