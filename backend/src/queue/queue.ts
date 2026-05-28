import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// BullMQ uses its own bundled ioredis — use plain options to avoid type conflicts
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl);

export const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  password: url.password || undefined,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
  maxRetriesPerRequest: null as null,
  family: 4, // Force IPv4, often required for Upstash locally to prevent ENOTFOUND
};

/** Main generation queue — processes AI question paper creation */
export const generationQueue = new Queue('paper-generation', { connection });

/**
 * Dead Letter Queue — jobs land here after exhausting all retry attempts.
 * A separate consumer (or monitoring dashboard) can inspect these.
 */
export const deadLetterQueue = new Queue('paper-generation-dlq', { connection });
