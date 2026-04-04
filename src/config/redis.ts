import { RedisOptions } from "ioredis";

export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};

export const QUEUE_NAMES = {
  SCORING: "scoring-queue",
} as const;

export const workerConfig = {
  concurrency: parseInt(process.env.SCORING_WORKER_CONCURRENCY || "3", 10),
};
