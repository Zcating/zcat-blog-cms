function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function parseCorsOrigins(defaultOrigins: string[]): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (raw === undefined || raw.trim() === '') {
    return [...defaultOrigins];
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

function parseAllowRegister(defaultValue: boolean): boolean {
  const raw = process.env.ALLOW_REGISTER;
  if (raw === undefined) {
    return defaultValue;
  }
  return raw === 'true';
}

const nodeEnv = optional('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

const devCorsOrigins = ['http://localhost:5000', 'http://localhost:1024'];

export const config = Object.freeze({
  // App
  port: Number(optional('PORT', '9090')),
  nodeEnv,

  // Database
  databaseUrl: required('DATABASE_URL'),

  // JWT
  jwtSecret: required('JWT_SECRET'),

  // Log
  logLevel: process.env.LOG_LEVEL,

  // MinIO / OSS
  minioEndpoint: optional('MINIO_ENDPOINT', 'localhost'),
  minioPort: Number(optional('MINIO_PORT', '9000')),
  minioUseSsl: optional('MINIO_USE_SSL', 'false') === 'true',
  minioAccessKey: optional('MINIO_ACCESS_KEY', ''),
  minioSecretKey: optional('MINIO_SECRET_KEY', ''),
  minioPublicUrl: optional('MINIO_PUBLIC_URL', ''),
  minioBucket: optional('MINIO_BUCKET', ''),

  // Security
  corsAllowedOrigins: parseCorsOrigins(isProduction ? [] : devCorsOrigins),
  allowRegister: parseAllowRegister(!isProduction),
});
