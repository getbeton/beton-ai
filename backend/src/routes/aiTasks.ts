import express from 'express';

import {
  AuthenticatedRequest,
  ApiResponse
} from '../types';
import { AiTaskService, CreateAiTaskJobRequest } from '../services/aiTaskService';
import { aiTaskQueue } from '../queues/aiTaskQueue';

const router = express.Router();
import prisma from '../lib/prisma';

// Create a new AI task job
router.post('/execute', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const request: CreateAiTaskJobRequest = req.body;

    // Validate required fields
    if (!request.tableId || !request.columnId || !request.integrationId || !request.executionScope) {
      return res.status(400).json({
        success: false,
        error: 'tableId, columnId, integrationId, and executionScope are required'
      });
    }

    // Create AI task job
    const jobId = await AiTaskService.createAiTaskJob(userId, request);

    // Add job to queue
    const queueJob = await aiTaskQueue.add({
      jobId,
      userId,
      tableId: request.tableId,
      columnId: request.columnId,
      integrationId: request.integrationId,
      prompt: request.prompt || '',
      modelConfig: request.modelConfig || {},
      executionScope: request.executionScope,
      targetRowIds: request.targetRowIds,
      targetCellId: request.targetCellId
    });

    // Update job with Bull job ID
    await prisma.aiTaskJob.update({
      where: { id: jobId },
      data: { bullJobId: queueJob.id.toString() }
    });

    const response: ApiResponse = {
      success: true,
      data: { jobId },
      message: 'AI task job created and queued successfully'
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating AI task job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create AI task job'
    });
  }
});

// Get AI task job status
router.get('/jobs/:jobId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { jobId } = req.params;

    const jobStatus = await AiTaskService.getJobStatus(jobId, userId);

    const response: ApiResponse = {
      success: true,
      data: jobStatus
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch job status'
    });
  }
});

// Cancel AI task job
router.post('/jobs/:jobId/cancel', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { jobId } = req.params;

    await AiTaskService.cancelJob(jobId, userId);

    const response: ApiResponse = {
      success: true,
      message: 'Job cancelled successfully'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel job'
    });
  }
});

// Get list of AI task jobs for user
router.get('/jobs', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const jobs = await prisma.aiTaskJob.findMany({
      where,
      include: {
        table: {
          select: { name: true }
        },
        column: {
          select: { name: true }
        },
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const transformedJobs = jobs.map(job => ({
      id: job.id,
      status: job.status,
      executionScope: job.executionScope,
      tableName: job.table.name,
      columnName: job.column.name,
      totalTasks: job.totalTasks,
      completedTasks: job.completedTasks,
      failedTasks: job.failedTasks,
      progress: job.totalTasks > 0 ? Math.round((job.completedTasks / job.totalTasks) * 100) : 0,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt
    }));

    const response: ApiResponse = {
      success: true,
      data: transformedJobs
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching AI task jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch AI task jobs'
    });
  }
});

// Validate AI task column settings
router.post('/validate-column', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Column settings are required'
      });
    }

    const validation = AiTaskService.validateAiTaskColumn(settings);

    const response: ApiResponse = {
      success: validation.isValid,
      data: {
        isValid: validation.isValid,
        errors: validation.errors
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error validating AI task column:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate AI task column'
    });
  }
});

// Get available variables for a table
router.get('/tables/:tableId/variables', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { tableId } = req.params;

    const variables = await AiTaskService.getAvailableVariables(tableId, userId);

    const response: ApiResponse = {
      success: true,
      data: { variables }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching available variables:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available variables'
    });
  }
});

// Get execution details for a job
router.get('/jobs/:jobId/executions', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { jobId } = req.params;
    const { status, limit = 100, offset = 0 } = req.query;

    // Verify job belongs to user
    const job = await prisma.aiTaskJob.findFirst({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const where: any = { jobId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const executions = await prisma.aiTaskExecution.findMany({
      where,
      include: {
        cell: {
          include: {
            row: {
              select: { order: true }
            },
            column: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const transformedExecutions = executions.map(exec => ({
      id: exec.id,
      status: exec.status,
      rowOrder: exec.cell.row.order,
      columnName: exec.cell.column.name,
      result: exec.result,
      error: exec.error,
      tokensUsed: exec.tokensUsed,
      cost: exec.cost ? Number(exec.cost) : null,
      executedAt: exec.executedAt,
      createdAt: exec.createdAt
    }));

    const response: ApiResponse = {
      success: true,
      data: transformedExecutions
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch executions'
    });
  }
});

export default router; 