import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// import { PrismaMariadb } from '@prisma/adapter-mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.get('DATABASE_HOST'),
      port: configService.get('DATABASE_PORT'),
      user: configService.get('DATABASE_USER'),
      password: configService.get('DATABASE_PASSWORD'),
      database: configService.get('DATABASE_NAME'),
      connectionLimit: 5,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
