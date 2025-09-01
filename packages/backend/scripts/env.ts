/* eslint-disable @typescript-eslint/no-floating-promises */

import { access, writeFile } from 'fs/promises';
import * as path from 'path';
// mysql -u root -p < init.sql

// create .env file
const envContent = `
# 数据库配置
DATABASE_URL="mysql://username:password@ip:port/db_name?connect_timeout=300"

# JWT配置
JWT_SECRET=
JWT_EXPIRES_IN=

# 应用配置
PORT=
NODE_ENV=
`;

// const sql = `CREATE DATABASE IF NOT EXISTS ${DB_DATABASE};`;

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const filePath = path.join(process.cwd(), '.env');
  const devPath = path.join(process.cwd(), '.env.development');
  const prodPath = path.join(process.cwd(), '.env.production');
  if (await exists(devPath)) {
    console.log('.env.development 文件已存在');
    return;
  }
  if (await exists(prodPath)) {
    console.log('.env.production 文件已存在');
    return;
  }
  if (await exists(filePath)) {
    console.log('.env 文件已存在');
    return;
  }
  await writeFile(filePath, envContent);
}

main();
