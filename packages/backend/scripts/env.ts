/* eslint-disable @typescript-eslint/no-floating-promises */

import { access, writeFile } from 'fs/promises';
import * as path from 'path';
// mysql -u root -p < init.sql

// create .env file
const envContent = `
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=
DB_SYNCHRONIZE=true

JWT_SECRET=
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
  const filePath = path.join(__dirname, '..', '.env');
  const devPath = path.join(__dirname, '..', '.env.development');
  const prodPath = path.join(__dirname, '..', '.env.production');
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
