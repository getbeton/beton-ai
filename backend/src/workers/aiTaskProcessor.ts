import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { AiTaskJobData, AiTaskService } from '../services/aiTaskService';
import { AI_TASK_CONFIG } from '../queues/aiTaskQueue';
import { WebSocketService } from '../services/websocketService';

const prisma = new PrismaClient();

export class AiTaskProcessor {
  /**
   * Process an AI task job
   */
  static async processAiTask(job: Job<AiTaskJobData>): Promise<void> {
    const { jobId, userId } = job.data;
    
    console.log(`Starting AI task job ${jobId} for user ${userId}`);

    try {
      // Mark job as running
      await prisma.aiTaskJob.update({
        where: { id: jobId },
        data: { 
          status: AI_TASK_CONFIG.JOB_STATUS.RUNNING,
          startedAt: new Date()
        }
      });

      // Get all pending executions for this job
      const executions = await prisma.aiTaskExecution.findMany({
        where: { 
          jobId,
          status: AI_TASK_CONFIG.EXECUTION_STATUS.PENDING
        },
        include: {
          job: true
        }
      });

      if (executions.length === 0) {
        console.log(`No pending executions found for job ${jobId}`);
        await this.markJobCompleted(jobId);
        return;
      }

      console.log(`Processing ${executions.length} AI task executions for job ${jobId}`);

      // Process executions in batches to avoid overwhelming the AI API
      await this.processExecutionsInBatches(
        executions, 
        jobId, 
        userId, 
        job
      );

    } catch (error: any) {
      console.error(`Error in AI task job ${jobId}:`, error);
      
      // Mark job as failed
      await prisma.aiTaskJob.update({
        where: { id: jobId },
        data: { 
          status: AI_TASK_CONFIG.JOB_STATUS.FAILED,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Process executions in batches for better performance and rate limiting
   */
  private static async processExecutionsInBatches(
    executions: any[],
    jobId: string,
    userId: string,
    job: Job<AiTaskJobData>
  ): Promise<void> {
    const batchSize = AI_TASK_CONFIG.BATCH_SIZE;
    let completedCount = 0;
    let failedCount = 0;

    // Process executions in batches
    for (let i = 0; i < executions.length; i += batchSize) {
      const batch = executions.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(executions.length / batchSize)} for job ${jobId}`);
      
      try {
        // Process batch executions concurrently (but limited by batch size)
        const batchPromises = batch.map(execution => 
          this.processExecution(execution, jobId, userId)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Count results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            completedCount++;
          } else {
            failedCount++;
            console.error(`Execution failed:`, result.reason);
          }
        });

        // Update job progress
        await prisma.aiTaskJob.update({
          where: { id: jobId },
          data: { 
            completedTasks: completedCount,
            failedTasks: failedCount
          }
        });

        // Send progress update via WebSocket
        const jobStatus = await AiTaskService.getJobStatus(jobId, userId);
        job.progress(jobStatus.progress.percentage);
        WebSocketService.sendJobProgress(userId, {
          id: jobId,
          type: 'ai_task',
          status: 'running',
          progress: {
            percentage: jobStatus.progress.percentage,
            completed: jobStatus.progress.completed,
            failed: jobStatus.progress.failed,
            total: jobStatus.progress.total
          },
          message: `Processing AI tasks: ${completedCount + failedCount}/${executions.length}`
        });

        console.log(`📊 Batch completed: ${completedCount} successful, ${failedCount} failed`);

        // Add delay between batches to respect rate limits
        if (i + batchSize < executions.length) {
          await this.delay(AI_TASK_CONFIG.API_DELAY_MS);
        }

      } catch (batchError: any) {
        console.error(`❌ Error processing batch for job ${jobId}:`, batchError);
        
        // Mark all executions in this batch as failed
        const batchExecutionIds = batch.map(exec => exec.id);
        await prisma.aiTaskExecution.updateMany({
          where: {
            id: { in: batchExecutionIds },
            status: AI_TASK_CONFIG.EXECUTION_STATUS.PENDING
          },
          data: {
            status: AI_TASK_CONFIG.EXECUTION_STATUS.FAILED,
            error: `Batch error: ${batchError.message}`,
            executedAt: new Date()
          }
        });

        failedCount += batch.length;
        
        // Update job failure count
        await prisma.aiTaskJob.update({
          where: { id: jobId },
          data: { 
            failedTasks: failedCount
          }
        });

        // Continue with next batch
        continue;
      }
    }

    // Mark job as completed
    await this.markJobCompleted(jobId);

    // Send completion notification
    const completedJobStatus = await AiTaskService.getJobStatus(jobId, userId);
    WebSocketService.sendJobComplete(userId, {
      id: jobId,
      type: 'ai_task',
      status: 'completed',
      progress: {
        percentage: completedJobStatus.progress.percentage,
        completed: completedJobStatus.progress.completed,
        failed: completedJobStatus.progress.failed,
        total: completedJobStatus.progress.total
      },
      message: `AI task completed: ${completedCount} successful, ${failedCount} failed`
    });

    console.log(`✅ AI task job ${jobId} completed: ${completedCount} successful, ${failedCount} failed`);
  }

  /**
   * Process a single AI task execution
   */
  private static async processExecution(execution: any, jobId: string, userId: string): Promise<void> {
    try {
      console.log(`🔄 Processing execution ${execution.id}`);

      // Mark execution as running
      await prisma.aiTaskExecution.update({
        where: { id: execution.id },
        data: { 
          status: AI_TASK_CONFIG.EXECUTION_STATUS.RUNNING 
        }
      });

      // Substitute variables in prompt
      const processedPrompt = await AiTaskService.substitutePromptVariables(
        execution.prompt,
        execution.cellId
      );

      // Update execution with processed prompt
      await prisma.aiTaskExecution.update({
        where: { id: execution.id },
        data: { prompt: processedPrompt }
      });

      // Execute AI task
      const result = await AiTaskService.executeAiTaskForCell(
        execution.job.integrationId,
        processedPrompt,
        execution.job.modelConfig
      );

      if (result.success) {
        // Update cell with result
        await prisma.tableCell.update({
          where: { id: execution.cellId },
          data: { 
            value: result.result,
            updatedAt: new Date()
          }
        });

        // Send real-time cell update via WebSocket (only if result has content)
        if (result.result) {
          WebSocketService.sendCellUpdate(userId, {
            cellId: execution.cellId,
            value: result.result,
            timestamp: new Date().toISOString()
          });
        }

        // Mark execution as completed
        await prisma.aiTaskExecution.update({
          where: { id: execution.id },
          data: {
            status: AI_TASK_CONFIG.EXECUTION_STATUS.COMPLETED,
            result: result.result,
            tokensUsed: result.tokensUsed || 0,
            cost: result.cost || 0,
            executedAt: new Date()
          }
        });

        console.log(`✅ Execution ${execution.id} completed successfully`);
      } else {
        // Mark execution as failed
        await prisma.aiTaskExecution.update({
          where: { id: execution.id },
          data: {
            status: AI_TASK_CONFIG.EXECUTION_STATUS.FAILED,
            error: result.error,
            executedAt: new Date()
          }
        });

        console.error(`❌ Execution ${execution.id} failed: ${result.error}`);
        throw new Error(result.error || 'AI task execution failed');
      }

    } catch (error: any) {
      console.error(`❌ Error processing execution ${execution.id}:`, error);
      
      // Mark execution as failed
      await prisma.aiTaskExecution.update({
        where: { id: execution.id },
        data: {
          status: AI_TASK_CONFIG.EXECUTION_STATUS.FAILED,
          error: error.message,
          executedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Mark job as completed and update final statistics
   */
  private static async markJobCompleted(jobId: string): Promise<void> {
    try {
      // Get final execution counts
      const executionCounts = await prisma.aiTaskExecution.groupBy({
        by: ['status'],
        where: { jobId },
        _count: { status: true }
      });

      let completedTasks = 0;
      let failedTasks = 0;

      executionCounts.forEach(count => {
        if (count.status === AI_TASK_CONFIG.EXECUTION_STATUS.COMPLETED) {
          completedTasks = count._count.status;
        } else if (count.status === AI_TASK_CONFIG.EXECUTION_STATUS.FAILED) {
          failedTasks = count._count.status;
        }
      });

      // Determine final job status
      let finalStatus: string;
      if (completedTasks === 0 && failedTasks > 0) {
        // All tasks failed
        finalStatus = AI_TASK_CONFIG.JOB_STATUS.FAILED;
      } else {
        // At least one task succeeded (or somehow no tasks ran)
        finalStatus = AI_TASK_CONFIG.JOB_STATUS.COMPLETED;
      }

      // Update job with final status
      await prisma.aiTaskJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          completedTasks,
          failedTasks,
          completedAt: new Date()
        }
      });

      console.log(`✅ Job ${jobId} marked as ${finalStatus.toLowerCase()}: ${completedTasks} successful, ${failedTasks} failed`);

    } catch (error) {
      console.error(`Error marking job ${jobId} as completed:`, error);
      throw error;
    }
  }

  /**
   * Utility function to add delay between operations
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 