import 'dotenv/config';
import * as path from 'path';

import * as dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load environment variables manually because prisma config loader might not pick up custom .env files automatically in all environments
// However, 'dotenv/config' above usually loads .env.
// The error suggests DATABASE_URL is missing.
// In this project, envs are in .env.development or .env.production.
// We need to load them conditionally or just load .env.development for local dev.

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prefer DIRECT TCP via DATABASE_URL
    url: env('DATABASE_URL'),
  },
});
