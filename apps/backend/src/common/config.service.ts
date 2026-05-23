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

export const config = Object.freeze({
  // App
  port: Number(optional('PORT', '9090')),
  nodeEnv: optional('NODE_ENV', 'development'),

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
});
