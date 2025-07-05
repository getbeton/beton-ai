import Redis from 'ioredis';

// Detect if running in Docker environment
const isDockerEnvironment = () => {
  // Check if we're in a Docker container by looking for common Docker indicators
  return process.env.NODE_ENV === 'production' || 
         process.env.DOCKER_ENV === 'true' ||
         process.env.RAILWAY_ENVIRONMENT === 'true' ||
         process.env.RAILWAY_SERVICE_NAME !== undefined;
};

// Create Redis connection with environment-aware configuration
export const createRedisConnection = () => {
  const isDocker = isDockerEnvironment();
  
  const redisConfig = {
    host: isDocker ? (process.env.REDIS_HOST || 'redis') : (process.env.REDIS_HOST || 'localhost'),
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  };

  console.log('🔧 Creating Redis connection with config:', {
    ...redisConfig,
    environment: isDocker ? 'Docker/Production' : 'Local Development'
  });

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