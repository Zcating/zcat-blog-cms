import { Injectable, OnModuleInit } from '@nestjs/common';

// import { PrismaMariadb } from '@prisma/adapter-mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    const adapter = new PrismaMariaDb(connectionString);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
