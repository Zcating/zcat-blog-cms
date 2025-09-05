/* eslint-disable @typescript-eslint/no-floating-promises */

import { access, writeFile } from 'fs/promises';
import * as path from 'path';
// mysql -u root -p < init.sql

// create .env file
const envContent = `
# 数据库配置
DATABASE_URL="mysql://root:123456@127.0.0.1:3306/zcat_blog_cms"

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
  const devPath = path.join(process.cwd(), '.env.development');
  const prodPath = path.join(process.cwd(), '.env.production');

  if (await exists(devPath)) {
    console.log('.env.development 文件已存在');
  } else {
    await writeFile(devPath, envContent);
  }

  if (await exists(prodPath)) {
    console.log('.env.production 文件已存在');
  } else {
    await writeFile(prodPath, envContent);
  }
}

main();
