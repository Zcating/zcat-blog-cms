/* eslint-disable @typescript-eslint/no-floating-promises */

import { access, writeFile } from 'fs/promises';
import * as path from 'path';
// mysql -u root -p < init.sql

// create .env file
const envContent = `
# 数据库配置
DATABASE_URL=postgresql://blog_cms_user:123456@127.0.0.1:5432/zcat_blog_cms?connect_timeout=300

# dev 环境
FRONTEND_URL=http://localhost:5173
BLOG_URL=http://localhost:5000

# JWT 配置
JWT_SECRET=HELLO_WORLD
JWT_EXPIRES_IN=1d

# 应用配置
PORT=9090
NODE_ENV=development

# OSS 配置
OSS_ACCESS_KEY=
OSS_SECRET_KEY=QQzs-
OSS_BUCKET=
OSS_DOMAIN=
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
  const devPath = path.join(process.cwd(), '.env.development');
  const prodPath = path.join(process.cwd(), '.env.production');
  if ((await exists(devPath)) || (await exists(prodPath))) {
    console.log('.env.development 或 .env.production 文件已存在');
    return;
  }
  await writeFile(devPath, envContent);
}

main();
