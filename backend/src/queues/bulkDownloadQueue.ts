import Queue, { Job, Queue as QueueType } from 'bull';
import { redisConnection } from '../config/redis';
import { BULK_DOWNLOAD_CONFIG } from '../config/bulkDownload';
import { BulkDownloadProcessor } from '../workers/bulkDownloadProcessor';

// Job data interface
export interface BulkDownloadJobData {
  jobId: string;
  userId: string;
  tableId: string;
  searchQuery: any;
  totalEstimated: number;
  totalPages: number;
  integrationId: string;
}

console.log('🔧 Initializing bulk download queue...');
console.log('📡 Redis config:', {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  url: process.env.REDIS_URL
});

// Prioritize REDIS_URL (IPv4) over REDIS_HOST (IPv6)
let bulkDownloadQueue: QueueType<BulkDownloadJobData>;

if (process.env.REDIS_URL) {
  console.log('🔗 Using REDIS_URL for Bull queue connection (IPv4)');
  // Use the REDIS_URL which points to IPv4
  bulkDownloadQueue = new Queue<BulkDownloadJobData>('bulk-download', process.env.REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: BULK_DOWNLOAD_CONFIG.MAX_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
} else {
  console.log('🏠 Using host/port for Bull queue connection with IPv4 forced');
  // Use host/port with IPv4 forced
  bulkDownloadQueue = new Queue<BulkDownloadJobData>('bulk-download', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      family: 4, // Force IPv4
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: BULK_DOWNLOAD_CONFIG.MAX_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

// Add Redis connection event listeners for debugging
bulkDownloadQueue.on('ready', () => {
  console.log('✅ Bull queue Redis connection established');
});

bulkDownloadQueue.on('error', (error: Error) => {
  console.error('❌ Bull queue Redis error:', error);
});

console.log('👷 Setting up job processor with concurrency:', BULK_DOWNLOAD_CONFIG.MAX_CONCURRENT_JOBS_GLOBAL);

// Set up job processor with concurrency
bulkDownloadQueue.process(BULK_DOWNLOAD_CONFIG.MAX_CONCURRENT_JOBS_GLOBAL, async (job: Job<BulkDownloadJobData>) => {
  console.log(`🚀 Starting to process bulk download job ${job.id}`);
  try {
    const result = await BulkDownloadProcessor.processBulkDownload(job);
    console.log(`✅ Successfully processed bulk download job ${job.id}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to process bulk download job ${job.id}:`, error);
    throw error;
  }
});

// Queue event listeners
bulkDownloadQueue.on('completed', (job: Job<BulkDownloadJobData>) => {
  console.log(`✅ Bulk download job ${job.id} completed`);
});

bulkDownloadQueue.on('failed', (job: Job<BulkDownloadJobData> | undefined, err: Error) => {
  console.error(`❌ Bulk download job ${job?.id} failed:`, err);
});

bulkDownloadQueue.on('progress', (job: Job<BulkDownloadJobData>, progress: number) => {
  console.log(`📊 Bulk download job ${job.id} progress: ${progress}%`);
});

bulkDownloadQueue.on('active', (job: Job<BulkDownloadJobData>) => {
  console.log(`🔄 Bulk download job ${job.id} started processing`);
});

bulkDownloadQueue.on('waiting', (jobId: string) => {
  console.log(`⏳ Bulk download job ${jobId} is waiting to be processed`);
});

bulkDownloadQueue.on('stalled', (job: Job<BulkDownloadJobData>) => {
  console.warn(`⚠️ Bulk download job ${job.id} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down bulk download queue...');
  await bulkDownloadQueue.close();
});

console.log('✅ Bulk download queue initialization complete');

export { bulkDownloadQueue }; 