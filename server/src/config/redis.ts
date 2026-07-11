import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

import { ENV } from './env.js';

// Instantiate Redis connection sharing with BullMQ
export const redisConnection = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null, // Required configuration for BullMQ compatibility
});

export const ASSET_QUEUE_NAME = 'asset-processing';

export const assetQueue = new Queue(ASSET_QUEUE_NAME, {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
