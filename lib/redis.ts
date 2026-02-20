// lib/redis.ts
import { Redis } from '@upstash/redis';

// Initialize the Upstash Redis client
// This uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment variables
export const redis = Redis.fromEnv();
