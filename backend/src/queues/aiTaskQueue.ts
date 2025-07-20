import Queue from 'bull';
import { AiTaskJobData } from '../services/aiTaskService';

// Use the same Redis configuration as bulk download queue
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

// AI Task Queue Configuration
export const AI_TASK_CONFIG = {
  MAX_CONCURRENT_JOBS_GLOBAL: parseInt(process.env.AI_TASK_MAX_CONCURRENT_JOBS || '10'),
  BATCH_SIZE: parseInt(process.env.AI_TASK_BATCH_SIZE || '50'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.AI_TASK_MAX_RETRY_ATTEMPTS || '3'),
  DEFAULT_TIMEOUT: parseInt(process.env.AI_TASK_DEFAULT_TIMEOUT || '60000'), // 60 seconds
  API_DELAY_MS: parseInt(process.env.AI_TASK_API_DELAY_MS || '100'), // Delay between AI API calls

  // Job statuses
  JOB_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running', 
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  } as const,

  // Execution statuses
  EXECUTION_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
  } as const
};

type QueueType<T> = Queue.Queue<T>;

// Prioritize REDIS_URL (IPv4) over REDIS_HOST (IPv6) - same pattern as bulk download
let aiTaskQueue: QueueType<AiTaskJobData>;

if (process.env.REDIS_URL) {
  console.log('🔗 Using REDIS_URL for AI Task queue connection (IPv4)');
  aiTaskQueue = new Queue<AiTaskJobData>('ai-task', process.env.REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: AI_TASK_CONFIG.MAX_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
} else {
  console.log('🏠 Using host/port for AI Task queue connection with IPv4 forced');
  aiTaskQueue = new Queue<AiTaskJobData>('ai-task', {
    redis: {
      host: redisHost,
      port: redisPort,
      family: 4, // Force IPv4
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: AI_TASK_CONFIG.MAX_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

// Add Redis connection event listeners for debugging
aiTaskQueue.on('ready', () => {
  console.log('✅ AI Task queue Redis connection established');
});

aiTaskQueue.on('error', (error) => {
  console.error('❌ AI Task queue Redis connection error:', error);
});

aiTaskQueue.on('waiting', (jobId) => {
  console.log(`⏳ AI Task job ${jobId} is waiting`);
});

aiTaskQueue.on('active', (job) => {
  console.log(`🚀 AI Task job ${job.id} is now active`);
});

aiTaskQueue.on('completed', (job) => {
  console.log(`✅ AI Task job ${job.id} completed successfully`);
});

aiTaskQueue.on('failed', (job, err) => {
  console.error(`❌ AI Task job ${job.id} failed:`, err.message);
});

aiTaskQueue.on('stalled', (job) => {
  console.warn(`⚠️ AI Task job ${job.id} stalled`);
});

// Set up job processor with concurrency
aiTaskQueue.process(AI_TASK_CONFIG.MAX_CONCURRENT_JOBS_GLOBAL, async (job: Queue.Job<AiTaskJobData>) => {
  console.log(`🚀 Starting to process AI task job ${job.id}`);
  try {
    const { AiTaskProcessor } = await import('../workers/aiTaskProcessor');
    const result = await AiTaskProcessor.processAiTask(job);
    console.log(`✅ Successfully processed AI task job ${job.id}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to process AI task job ${job.id}:`, error);
    throw error;
  }
});

export { aiTaskQueue }; 