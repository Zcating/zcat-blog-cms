/* eslint-disable @typescript-eslint/no-floating-promises */

import { access, writeFile } from 'fs/promises';
import * as path from 'path';
// mysql -u root -p < init.sql

// create .env file
const envContent = `
# 数据库配置
DATABASE_URL="mysql://username:password@ip:port/db_name?connect_timeout=300"

# dev 环境
FRONTEND_URL=http://localhost:5173
BLOG_URL=http://localhost:5000

# JWT 配置
JWT_SECRET=HELLO_WORLD
JWT_EXPIRES_IN=1d

# 应用配置
PORT=9090
NODE_ENV=development
`;

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
