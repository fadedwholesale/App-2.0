import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const connectRedis = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => redisClient;
