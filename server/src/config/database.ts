import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from './env.js';
import pg from 'pg';

const connectionString = ENV.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ENV.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
