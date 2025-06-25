/* eslint-disable @typescript-eslint/no-floating-promises */

import { writeFile } from 'fs/promises';
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

async function main() {
  await writeFile(path.join(__dirname, '..', '.env'), envContent);
}

main();
