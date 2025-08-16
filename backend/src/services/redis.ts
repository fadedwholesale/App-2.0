import { logger } from '../utils/logger';

// Mock Redis implementation for development
export const connectRedis = async () => {
  if (process.env.REDIS_URL) {
    // Real Redis connection would go here
    logger.info('Redis URL provided, connecting to Redis...');
    return;
  }
  
  // For development without Redis
  logger.info('No Redis URL provided, using in-memory cache');
  return;
};

// Mock cache implementation
const cache = new Map<string, any>();

export const redis = {
  get: async (key: string) => {
    return cache.get(key);
  },
  set: async (key: string, value: any, ttl?: number) => {
    cache.set(key, value);
    if (ttl) {
      setTimeout(() => cache.delete(key), ttl * 1000);
    }
    return 'OK';
  },
  del: async (key: string) => {
    return cache.delete(key);
  }
};
