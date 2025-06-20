import path from 'path';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

const __dirname = path.resolve();

const pathList = ['.env.local', '.env.development', '.env.production', '.env'];

pathList.forEach((pathItem) => {
  config({ path: path.resolve(__dirname, pathItem) });
});

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [`${__dirname}/dist/src/table/*.entity.{ts, js}`],
  // 根据自己的需求定义，migrations
  migrations: [`${__dirname}/dist/src/migration/*{.ts,.js}`],
  synchronize: false,
});
