import Queue, { Job } from 'bull';
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

// Create Bull queue for bulk downloads
export const bulkDownloadQueue = new Queue<BulkDownloadJobData>('bulk-download', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    attempts: BULK_DOWNLOAD_CONFIG.MAX_RETRY_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Set up job processor with concurrency
bulkDownloadQueue.process(BULK_DOWNLOAD_CONFIG.MAX_CONCURRENT_JOBS_GLOBAL, async (job: Job<BulkDownloadJobData>) => {
  return BulkDownloadProcessor.processBulkDownload(job);
});

// Queue event listeners
bulkDownloadQueue.on('completed', (job: Job<BulkDownloadJobData>) => {
  console.log(`Bulk download job ${job.id} completed`);
});

bulkDownloadQueue.on('failed', (job: Job<BulkDownloadJobData> | undefined, err: Error) => {
  console.error(`Bulk download job ${job?.id} failed:`, err);
});

bulkDownloadQueue.on('progress', (job: Job<BulkDownloadJobData>, progress: number) => {
  console.log(`Bulk download job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down bulk download queue...');
  await bulkDownloadQueue.close();
}); 