import { PrismaClient } from '@prisma/client';
import { Job } from 'bull';
import { ApolloService, PeopleSearchFilters } from './apolloService';
import { bulkDownloadQueue, BulkDownloadJobData } from '../queues/bulkDownloadQueue';
import { BULK_DOWNLOAD_CONFIG, JobStatus } from '../config/bulkDownload';

const prisma = new PrismaClient();

export interface BulkDownloadEstimate {
  totalRecords: number;
  totalPages: number;
  estimatedDuration: string;
  exceedsWarningThreshold: boolean;
}

export interface BulkDownloadJobInfo {
  id: string;
  status: JobStatus;
  progress: {
    currentPage: number;
    totalPages: number;
    processedRecords: number;
    totalEstimated: number;
    percentage: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class BulkDownloadService {
  /**
   * Estimate the total records and pages for a bulk download
   */
  static async estimateDownload(
    integrationId: string,
    filters: PeopleSearchFilters
  ): Promise<BulkDownloadEstimate> {
    try {
      // Get the integration and API key
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
        include: {
          apiKeys: {
            where: { isActive: true },
            take: 1
          },
          platformKey: true
        }
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      // Get API key (from personal keys or platform key)
      let apiKey: string;
      if (integration.keySource === 'personal' && integration.apiKeys.length > 0) {
        apiKey = integration.apiKeys[0].apiKey;
      } else if (integration.keySource === 'platform' && integration.platformKey) {
        const platformKey = await prisma.platformApiKey.findUnique({
          where: { id: integration.platformKeyId! }
        });
        if (!platformKey) {
          throw new Error('Platform API key not found');
        }
        apiKey = platformKey.apiKey;
      } else {
        throw new Error('No valid API key found for integration');
      }

      // Get first page to determine total records - clean filters first
      const cleanFilters = { ...filters };
      delete cleanFilters.page;
      delete cleanFilters.per_page;
      
      const firstPageFilters = { ...cleanFilters, page: 1, per_page: 100 };
      const firstPageResult = await ApolloService.searchPeople(apiKey, firstPageFilters);
      
      const totalRecords = firstPageResult.pagination.total_entries;
      const totalPages = Math.ceil(totalRecords / 100);
      
      // Estimate duration (assuming 1 second per page + API delays)
      const estimatedMinutes = Math.ceil(totalPages * (BULK_DOWNLOAD_CONFIG.APOLLO_API_DELAY_MS / 1000) / 60);
      const estimatedDuration = estimatedMinutes < 1 ? '< 1 minute' : `~${estimatedMinutes} minutes`;
      
      return {
        totalRecords,
        totalPages,
        estimatedDuration,
        exceedsWarningThreshold: totalRecords > BULK_DOWNLOAD_CONFIG.WARNING_THRESHOLD
      };
    } catch (error) {
      console.error('Error estimating bulk download:', error);
      throw new Error('Failed to estimate download size');
    }
  }

  /**
   * Create a new bulk download job
   */
  static async createBulkDownloadJob(
    userId: string,
    tableName: string,
    searchQuery: PeopleSearchFilters,
    integrationId: string
  ): Promise<string> {
    try {
      // Check concurrent job limit
      const activeJobs = await prisma.bulkDownloadJob.count({
        where: {
          userId,
          status: {
            in: [BULK_DOWNLOAD_CONFIG.JOB_STATUS.PENDING, BULK_DOWNLOAD_CONFIG.JOB_STATUS.RUNNING]
          }
        }
      });

      if (activeJobs >= BULK_DOWNLOAD_CONFIG.MAX_CONCURRENT_JOBS_PER_USER) {
        throw new Error(`Maximum concurrent jobs limit (${BULK_DOWNLOAD_CONFIG.MAX_CONCURRENT_JOBS_PER_USER}) reached`);
      }

      // Get estimate for the download
      const estimate = await this.estimateDownload(integrationId, searchQuery);

      // Create the table first
      const table = await prisma.userTable.create({
        data: {
          userId,
          name: tableName,
          sourceType: 'apollo',
          isProcessing: true,
          columns: {
            create: [
              { name: 'First Name', type: 'text', order: 1 },
              { name: 'Last Name', type: 'text', order: 2 },
              { name: 'Email', type: 'email', order: 3 },
              { name: 'Phone', type: 'text', order: 4 },
              { name: 'Title', type: 'text', order: 5 },
              { name: 'Company', type: 'text', order: 6 },
              { name: 'LinkedIn', type: 'url', order: 7 },
              { name: 'Location', type: 'text', order: 8 },
              { name: 'Seniority', type: 'text', order: 9 },
              { name: 'Department', type: 'text', order: 10 }
            ]
          }
        }
      });

      // Create the bulk download job record
      const bulkJob = await prisma.bulkDownloadJob.create({
        data: {
          userId,
          tableId: table.id,
          searchQuery: searchQuery as any,
          totalEstimated: estimate.totalRecords,
          totalPages: estimate.totalPages,
          status: BULK_DOWNLOAD_CONFIG.JOB_STATUS.PENDING
        }
      });

      // Add job to Bull queue
      const queueJob = await bulkDownloadQueue.add({
        jobId: bulkJob.id,
        userId,
        tableId: table.id,
        searchQuery,
        totalEstimated: estimate.totalRecords,
        totalPages: estimate.totalPages,
        integrationId
      });

      // Update the job with Bull job ID
      await prisma.bulkDownloadJob.update({
        where: { id: bulkJob.id },
        data: { bullJobId: queueJob.id.toString() }
      });

      return bulkJob.id;
    } catch (error) {
      console.error('Error creating bulk download job:', error);
      throw error;
    }
  }

  /**
   * Get job status and progress
   */
  static async getJobInfo(jobId: string): Promise<BulkDownloadJobInfo | null> {
    try {
      const job = await prisma.bulkDownloadJob.findUnique({
        where: { id: jobId },
        include: { table: true }
      });

      if (!job) return null;

      const percentage = job.totalEstimated ? 
        Math.round((job.totalProcessed / job.totalEstimated) * 100) : 0;

      return {
        id: job.id,
        status: job.status as JobStatus,
        progress: {
          currentPage: job.currentPage,
          totalPages: job.totalPages || 0,
          processedRecords: job.totalProcessed,
          totalEstimated: job.totalEstimated || 0,
          percentage
        },
        createdAt: job.createdAt,
        startedAt: job.startedAt || undefined,
        completedAt: job.completedAt || undefined,
        error: job.lastError || undefined
      };
    } catch (error) {
      console.error('Error getting job info:', error);
      return null;
    }
  }

  /**
   * Cancel a bulk download job
   */
  static async cancelJob(jobId: string, userId: string): Promise<boolean> {
    try {
      const job = await prisma.bulkDownloadJob.findFirst({
        where: { id: jobId, userId }
      });

      if (!job) return false;

      // Cancel the Bull job if it exists
      if (job.bullJobId) {
        const bullJob = await bulkDownloadQueue.getJob(job.bullJobId);
        if (bullJob) {
          await bullJob.remove();
        }
      }

      // Update job status
      await prisma.bulkDownloadJob.update({
        where: { id: jobId },
        data: { status: BULK_DOWNLOAD_CONFIG.JOB_STATUS.CANCELLED }
      });

      // Unlock the table
      await prisma.userTable.update({
        where: { id: job.tableId },
        data: { isProcessing: false, processingJobId: null }
      });

      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Get user's active jobs
   */
  static async getUserJobs(userId: string): Promise<BulkDownloadJobInfo[]> {
    try {
      const jobs = await prisma.bulkDownloadJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return Promise.all(
        jobs.map(async (job) => {
          const jobInfo = await this.getJobInfo(job.id);
          return jobInfo!;
        })
      );
    } catch (error) {
      console.error('Error getting user jobs:', error);
      return [];
    }
  }
} 