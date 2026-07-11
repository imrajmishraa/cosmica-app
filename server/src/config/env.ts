import 'dotenv/config';

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  HOST: process.env.HOST ?? 'localhost',
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  DATABASE_URL: getEnv('DATABASE_URL'),
  REDIS_URL: getEnv('REDIS_URL'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-replace-in-production-1234567890',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  UPLOAD_TEMP_DIR: process.env.UPLOAD_TEMP_DIR || './uploads/temp',

  AWS_REGION: process.env.AWS_REGION ?? 'auto',
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
} as const;
