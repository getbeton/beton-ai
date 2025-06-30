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

  console.log('🔧 Creating Redis connection with config:', redisConfig);

  const redis = new Redis(redisConfig);
  
  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redis.on('ready', () => {
    console.log('✅ Redis connection established');
  });

  redis.on('connect', () => {
    console.log('🔌 Redis connecting...');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  return redis;
};

// Redis connection for Bull Queue
console.log('🚀 Initializing Redis connection for Bull Queue...');
export const redisConnection = createRedisConnection(); 