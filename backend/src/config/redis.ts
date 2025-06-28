import Redis from 'ioredis';

// Create Redis connection
export const createRedisConnection = () => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  };

  const redis = new Redis(redisConfig);
  
  redis.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  redis.on('ready', () => {
    console.log('Redis connection established');
  });

  return redis;
};

// Redis connection for Bull Queue
export const redisConnection = createRedisConnection(); 