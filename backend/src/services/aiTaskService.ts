import { PrismaClient } from '@prisma/client';
import { ServiceFactory } from './serviceFactory';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface AiTaskJobData {
  jobId: string;
  userId: string;
  tableId: string;
  columnId: string;
  integrationId: string;
  prompt: string;
  modelConfig: any;
  executionScope: 'column' | 'selected_rows' | 'single_row' | 'single_cell';
  targetRowIds?: string[];
  targetCellId?: string;
}

export interface CreateAiTaskJobRequest {
  tableId: string;
  columnId: string;
  integrationId: string;
  prompt?: string; // override column prompt
  modelConfig?: any;
  executionScope: 'column' | 'selected_rows' | 'single_row' | 'single_cell';
  targetRowIds?: string[];
  targetCellId?: string;
}

export interface AiTaskExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
  tokensUsed?: number;
  cost?: number;
}

export class AiTaskService {
  
  /**
   * Create a new AI task job
   */
  static async createAiTaskJob(
    userId: string,
    request: CreateAiTaskJobRequest
  ): Promise<string> {
    try {
      const { 
        tableId, 
        columnId, 
        integrationId, 
        prompt: promptOverride, 
        modelConfig = {}, 
        executionScope,
        targetRowIds = [],
        targetCellId
      } = request;

      // Verify table belongs to user
      const table = await prisma.userTable.findFirst({
        where: { id: tableId, userId },
        include: {
          columns: {
            where: { id: columnId }
          }
        }
      });

      if (!table) {
        throw new Error('Table not found or access denied');
      }

      const column = table.columns[0];
      if (!column) {
        throw new Error('Column not found');
      }

      if (column.type !== 'ai_task') {
        throw new Error('Column is not an AI task column');
      }

      // Verify integration belongs to user and is active
      const integration = await prisma.integration.findFirst({
        where: { 
          id: integrationId, 
          userId, 
          isActive: true 
        }
      });

      if (!integration) {
        throw new Error('Integration not found or inactive');
      }

      // Get prompt from column settings or use override
      const columnSettings = column.settings as any;
      const finalPrompt = promptOverride || columnSettings.aiTask?.prompt;
      
      if (!finalPrompt) {
        throw new Error('No prompt specified in column or request');
      }

      // Determine target cells based on execution scope
      let targetCells: { id: string; rowId: string }[] = [];
      
      // Ensure all rows have cells for this column (fix for existing AI task columns)
      if (executionScope === 'column') {
        await this.ensureAllRowsHaveCells(tableId, columnId);
      }
      
      switch (executionScope) {
        case 'column':
          // Get all cells in this column
          targetCells = await prisma.tableCell.findMany({
            where: { columnId },
            select: { id: true, rowId: true }
          });
          break;
          
        case 'selected_rows':
          if (!targetRowIds || targetRowIds.length === 0) {
            throw new Error('No target rows specified for selected_rows scope');
          }
          targetCells = await prisma.tableCell.findMany({
            where: { 
              columnId,
              rowId: { in: targetRowIds }
            },
            select: { id: true, rowId: true }
          });
          break;
          
        case 'single_row':
          if (!targetRowIds || targetRowIds.length !== 1) {
            throw new Error('Single row ID required for single_row scope');
          }
          targetCells = await prisma.tableCell.findMany({
            where: { 
              columnId,
              rowId: targetRowIds[0]
            },
            select: { id: true, rowId: true }
          });
          break;
          
        case 'single_cell':
          if (!targetCellId) {
            throw new Error('Target cell ID required for single_cell scope');
          }
          const cell = await prisma.tableCell.findFirst({
            where: { id: targetCellId, columnId },
            select: { id: true, rowId: true }
          });
          if (cell) {
            targetCells = [cell];
          }
          break;
          
        default:
          throw new Error('Invalid execution scope');
      }

      if (targetCells.length === 0) {
        throw new Error('No target cells found for execution');
      }

      // Create the AI task job
      const aiTaskJob = await prisma.aiTaskJob.create({
        data: {
          userId,
          tableId,
          columnId,
          integrationId,
          prompt: finalPrompt,
          modelConfig,
          executionScope,
          targetRowIds: executionScope === 'column' ? [] : targetRowIds,
          targetCellId: executionScope === 'single_cell' ? targetCellId : null,
          totalTasks: targetCells.length,
          status: 'pending'
        }
      });

      // Create execution records for each target cell
      const executionPromises = targetCells.map(cell => 
        prisma.aiTaskExecution.create({
          data: {
            jobId: aiTaskJob.id,
            cellId: cell.id,
            prompt: finalPrompt, // Will be processed with variables later
            status: 'pending'
          }
        })
      );

      await Promise.all(executionPromises);

      return aiTaskJob.id;

    } catch (error) {
      console.error('Error creating AI task job:', error);
      throw error;
    }
  }

  /**
   * Substitute variables in prompt with actual row data
   */
  static async substitutePromptVariables(
    prompt: string, 
    cellId: string
  ): Promise<string> {
    try {
      // Get the cell and its row data
      const cell = await prisma.tableCell.findUnique({
        where: { id: cellId },
        include: {
          row: {
            include: {
              cells: {
                include: {
                  column: true
                }
              }
            }
          }
        }
      });

      if (!cell) {
        throw new Error('Cell not found');
      }

      // Build row data map
      const rowData: Record<string, string> = {};
      cell.row.cells.forEach(rowCell => {
        rowData[rowCell.column.name] = rowCell.value || '';
      });

      // Substitute variables using simple regex
      const processedPrompt = prompt.replace(/\{\{(\w+)\}\}/g, (match, columnName) => {
        return rowData[columnName] || match; // Keep original if column doesn't exist
      });

      return processedPrompt;

    } catch (error) {
      console.error('Error substituting prompt variables:', error);
      throw error;
    }
  }

  /**
   * Execute AI task for a single cell
   */
  static async executeAiTaskForCell(
    integrationId: string,
    processedPrompt: string,
    modelConfig: any = {}
  ): Promise<AiTaskExecutionResult> {
    try {
      // Get the integration with API key
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

      // Get API key
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

      // Prepare request based on service type
      const request = {
        prompt: processedPrompt,
        model: modelConfig.model || 'gpt-4o-mini',
        maxTokens: modelConfig.maxTokens || 4000,
        temperature: modelConfig.temperature || 0.7,
        systemPrompt: modelConfig.systemPrompt
      };

      // Execute using ServiceFactory
      const result = await ServiceFactory.executeAction(
        integration.serviceName,
        apiKey,
        'text_generation',
        request
      );

      console.log('ServiceFactory result:', result); // Debug log

      // Check if the result indicates success
      // ServiceFactory returns raw response for successful calls, or {success: false, error: ...} for failures
      const isSuccess = result && (result.content || result.success === true);
      
      if (isSuccess) {
        // Extract usage information if available
        const usage = result.usage || {};
        const tokensUsed = usage.totalTokens || 0;
        
        // Calculate cost (this will depend on the service)
        let cost = 0;
        if (integration.serviceName === 'openai' && usage.promptTokens && usage.completionTokens) {
          // Use OpenAI cost calculation
          const { OpenAIService } = await import('./openaiService');
          cost = OpenAIService.calculateCost(usage, request.model);
        }

        return {
          success: true,
          result: result.content || result.data?.content || result.result,
          tokensUsed,
          cost
        };
      } else {
        console.error('ServiceFactory execution failed:', result.error || result); // Better error logging
        return {
          success: false,
          error: result.error || 'AI task execution failed'
        };
      }

    } catch (error: any) {
      console.error('Error executing AI task for cell:', error);
      return {
        success: false,
        error: error.message || 'Unexpected error during AI task execution'
      };
    }
  }

  /**
   * Get AI task job status and progress
   */
  static async getJobStatus(jobId: string, userId: string) {
    try {
      const job = await prisma.aiTaskJob.findFirst({
        where: { id: jobId, userId },
        include: {
          executions: {
            select: {
              id: true,
              status: true,
              error: true,
              tokensUsed: true,
              cost: true,
              executedAt: true
            }
          },
          table: {
            select: { name: true }
          },
          column: {
            select: { name: true }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      const progress = {
        percentage: job.totalTasks > 0 ? Math.round((job.completedTasks / job.totalTasks) * 100) : 0,
        completed: job.completedTasks,
        failed: job.failedTasks,
        total: job.totalTasks
      };

      const totalTokens = job.executions.reduce((sum: number, exec: any) => sum + (exec.tokensUsed || 0), 0);
      const totalCost = job.executions.reduce((sum: number, exec: any) => sum + Number(exec.cost || 0), 0);

      return {
        id: job.id,
        status: job.status,
        executionScope: job.executionScope,
        tableName: job.table.name,
        columnName: job.column.name,
        progress,
        usage: {
          totalTokens,
          totalCost: totalCost.toFixed(6)
        },
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt
      };

    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Cancel an AI task job
   */
  static async cancelJob(jobId: string, userId: string): Promise<void> {
    try {
      const job = await prisma.aiTaskJob.findFirst({
        where: { id: jobId, userId }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status === 'completed' || job.status === 'cancelled') {
        throw new Error('Job cannot be cancelled');
      }

      await prisma.aiTaskJob.update({
        where: { id: jobId },
        data: {
          status: 'cancelled',
          completedAt: new Date()
        }
      });

      // Update pending executions
      await prisma.aiTaskExecution.updateMany({
        where: {
          jobId,
          status: 'pending'
        },
        data: {
          status: 'failed',
          error: 'Job was cancelled'
        }
      });

    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  /**
   * Validate AI task column configuration
   */
  static validateAiTaskColumn(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.aiTask) {
      errors.push('AI task configuration is required');
      return { isValid: false, errors };
    }

    const { prompt, useCase } = settings.aiTask;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (prompt && prompt.length > 8000) {
      errors.push('Prompt cannot exceed 8000 characters');
    }

    if (!useCase || useCase !== 'content_creation') {
      errors.push('Use case must be "content_creation"');
    }

    // Validate variable syntax in prompt
    if (prompt) {
      const variableMatches = prompt.match(/\{\{(\w+)\}\}/g);
      if (variableMatches) {
                 const invalidVariables = variableMatches.filter((match: string) => {
           const variableName = match.replace(/\{\{|\}\}/g, '');
           return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName);
         });
        
        if (invalidVariables.length > 0) {
          errors.push(`Invalid variable names: ${invalidVariables.join(', ')}`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get available column variables for a table
   */
  static async getAvailableVariables(tableId: string, userId: string): Promise<string[]> {
    try {
      const table = await prisma.userTable.findFirst({
        where: { id: tableId, userId },
        include: {
          columns: {
            select: { name: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!table) {
        throw new Error('Table not found');
      }

      return table.columns.map(col => col.name);

    } catch (error) {
      console.error('Error getting available variables:', error);
      throw error;
    }
  }

  /**
   * Ensure all rows in a table have at least one cell for a given column.
   * This is necessary because existing AI task columns might not have cells for all rows.
   * This function is called when a job is created for a 'column' execution scope.
   */
  private static async ensureAllRowsHaveCells(tableId: string, columnId: string) {
    const rows = await prisma.tableRow.findMany({
      where: { tableId },
      select: { id: true }
    });

    const existingCells = await prisma.tableCell.findMany({
      where: { columnId },
      select: { rowId: true }
    });

    const existingRowIds = new Set(existingCells.map(cell => cell.rowId));

    for (const row of rows) {
      if (!existingRowIds.has(row.id)) {
        await prisma.tableCell.create({
          data: {
            columnId,
            rowId: row.id,
            value: '', // Default empty value
            createdAt: new Date()
          }
        });
        console.log(`Added missing cell for row ${row.id} in column ${columnId}`);
      }
    }
  }
} 