import express from 'express';
import { BulkDownloadService } from '../services/bulkDownloadService';
import { PeopleSearchFilters } from '../services/apolloService';

const router = express.Router();

/**
 * POST /api/bulk-download/estimate
 * Get estimate for bulk download
 */
router.post('/estimate', async (req: any, res) => {
  try {
    const { searchQuery, integrationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!searchQuery || !integrationId) {
      return res.status(400).json({
        success: false,
        error: 'searchQuery and integrationId are required'
      });
    }

    const estimate = await BulkDownloadService.estimateDownload(integrationId, searchQuery);

    res.json({
      success: true,
      data: estimate
    });
  } catch (error: any) {
    console.error('Error estimating bulk download:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to estimate download'
    });
  }
});

/**
 * POST /api/bulk-download/start
 * Start a bulk download job
 */
router.post('/start', async (req: any, res) => {
  try {
    const { tableName, searchQuery, integrationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!tableName || !searchQuery || !integrationId) {
      return res.status(400).json({
        success: false,
        error: 'tableName, searchQuery, and integrationId are required'
      });
    }

    const jobId = await BulkDownloadService.createBulkDownloadJob(
      userId,
      tableName,
      searchQuery,
      integrationId
    );

    res.json({
      success: true,
      data: { jobId }
    });
  } catch (error: any) {
    console.error('Error starting bulk download:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start bulk download'
    });
  }
});

/**
 * GET /api/bulk-download/job/:jobId
 * Get job status and progress
 */
router.get('/job/:jobId', async (req: any, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const jobInfo = await BulkDownloadService.getJobInfo(jobId);

    if (!jobInfo) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: jobInfo
    });
  } catch (error: any) {
    console.error('Error getting job info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job info'
    });
  }
});

/**
 * POST /api/bulk-download/job/:jobId/cancel
 * Cancel a bulk download job
 */
router.post('/job/:jobId/cancel', async (req: any, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const success = await BulkDownloadService.cancelJob(jobId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel job'
    });
  }
});

/**
 * GET /api/bulk-download/jobs
 * Get user's bulk download jobs with filtering and sorting
 */
router.get('/jobs', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { status, sortBy = 'createdAt', sortOrder = 'desc', limit = '50' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const jobs = await BulkDownloadService.getUserJobs(userId);

    // Apply filtering and sorting
    let filteredJobs = jobs;
    
    // Filter by status if provided
    if (status) {
      filteredJobs = jobs.filter(job => job.status === status);
    }

    // Sort jobs
    filteredJobs.sort((a, b) => {
      if (sortBy === 'createdAt') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      }
      
      // For other fields, convert to string for comparison
      const aStr = String((a as any)[sortBy] || '');
      const bStr = String((b as any)[sortBy] || '');
      
      if (sortOrder === 'desc') {
        return bStr.localeCompare(aStr);
      } else {
        return aStr.localeCompare(bStr);
      }
    });

    // Apply limit
    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      filteredJobs = filteredJobs.slice(0, limitNum);
    }

    // Separate running jobs for quick access
    const runningJobs = filteredJobs.filter(job => job.status === 'running' || job.status === 'pending');
    const completedJobs = filteredJobs.filter(job => job.status === 'completed');
    const failedJobs = filteredJobs.filter(job => job.status === 'failed');

    res.json({
      success: true,
      data: {
        all: filteredJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
        summary: {
          total: filteredJobs.length,
          running: runningJobs.length,
          completed: completedJobs.length,
          failed: failedJobs.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting user jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get jobs'
    });
  }
});

/**
 * GET /api/bulk-download/jobs/all
 * Get comprehensive list of user's jobs with chronological ordering and status filtering
 */
router.get('/jobs/all', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { status, sortBy = 'createdAt', sortOrder = 'desc', limit = '100' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const jobs = await BulkDownloadService.getUserJobs(userId);

    // Apply filtering and sorting
    let filteredJobs = jobs;
    
    // Filter by status if provided
    if (status) {
      filteredJobs = jobs.filter(job => job.status === status);
    }

    // Sort jobs (default: newest first)
    filteredJobs.sort((a, b) => {
      if (sortBy === 'createdAt') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      }
      
      // For other fields, convert to string for comparison
      const aStr = String((a as any)[sortBy] || '');
      const bStr = String((b as any)[sortBy] || '');
      
      if (sortOrder === 'desc') {
        return bStr.localeCompare(aStr);
      } else {
        return aStr.localeCompare(bStr);
      }
    });

    // Apply limit
    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      filteredJobs = filteredJobs.slice(0, limitNum);
    }

    // Separate jobs by status for easier management
    const runningJobs = filteredJobs.filter(job => job.status === 'running' || job.status === 'pending');
    const completedJobs = filteredJobs.filter(job => job.status === 'completed');
    const failedJobs = filteredJobs.filter(job => job.status === 'failed');
    const cancelledJobs = filteredJobs.filter(job => job.status === 'cancelled');

    // Add relative time information
    const jobsWithTime = filteredJobs.map(job => ({
      ...job,
      timeAgo: getTimeAgo(job.createdAt),
      duration: job.completedAt ? 
        Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000) : 
        null
    }));

    res.json({
      success: true,
      data: {
        all: jobsWithTime,
        byStatus: {
          running: runningJobs,
          completed: completedJobs,
          failed: failedJobs,
          cancelled: cancelledJobs
        },
        summary: {
          total: filteredJobs.length,
          running: runningJobs.length,
          completed: completedJobs.length,
          failed: failedJobs.length,
          cancelled: cancelledJobs.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting comprehensive job list:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get jobs'
    });
  }
});

/**
 * Helper function to get relative time
 */
function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default router; 