export const BULK_DOWNLOAD_CONFIG = {
  WARNING_THRESHOLD: parseInt(process.env.BULK_DOWNLOAD_WARNING_THRESHOLD || '1000'),
  MAX_CONCURRENT_JOBS_PER_USER: parseInt(process.env.MAX_CONCURRENT_JOBS_PER_USER || '2'),
  MAX_CONCURRENT_JOBS_GLOBAL: parseInt(process.env.MAX_CONCURRENT_JOBS_GLOBAL || '100'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
  APOLLO_API_DELAY_MS: parseInt(process.env.APOLLO_API_DELAY_MS || '100'), // Reduced for faster processing
  PROGRESS_UPDATE_INTERVAL: parseInt(process.env.PROGRESS_UPDATE_INTERVAL || '10'),
  
  // Performance optimizations
  APOLLO_PAGE_SIZE: parseInt(process.env.APOLLO_PAGE_SIZE || '100'), // Increased from 100 for more data per API call
  DB_BATCH_PAGES: parseInt(process.env.DB_BATCH_PAGES || '5'), // Process multiple pages before DB insertion
  PARALLEL_API_CALLS: parseInt(process.env.PARALLEL_API_CALLS || '3'), // Number of concurrent API calls
  
  // Job statuses
  JOB_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running', 
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  } as const,
  
  // Progress statuses
  PROGRESS_STATUS: {
    COMPLETED: 'completed',
    FAILED: 'failed'
  } as const,
  
  // Job types
  JOB_TYPES: {
    APOLLO_PEOPLE_SEARCH: 'apollo_people_search'
  } as const
};

export type JobStatus = typeof BULK_DOWNLOAD_CONFIG.JOB_STATUS[keyof typeof BULK_DOWNLOAD_CONFIG.JOB_STATUS];
export type ProgressStatus = typeof BULK_DOWNLOAD_CONFIG.PROGRESS_STATUS[keyof typeof BULK_DOWNLOAD_CONFIG.PROGRESS_STATUS];
export type JobType = typeof BULK_DOWNLOAD_CONFIG.JOB_TYPES[keyof typeof BULK_DOWNLOAD_CONFIG.JOB_TYPES]; 