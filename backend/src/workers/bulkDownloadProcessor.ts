import { Job } from 'bull';

import { ApolloService } from '../services/apolloService';
import { BulkDownloadJobData } from '../queues/bulkDownloadQueue';
import { BULK_DOWNLOAD_CONFIG } from '../config/bulkDownload';
import { WebSocketService } from '../services/websocketService';
import { BulkDownloadService } from '../services/bulkDownloadService';

import prisma from '../lib/prisma';

export class BulkDownloadProcessor {
  /**
   * Process a bulk download job
   */
  static async processBulkDownload(job: Job<BulkDownloadJobData>): Promise<void> {
    const { jobId, userId, tableId, searchQuery, totalPages, integrationId } = job.data;

    console.log(`Starting bulk download job ${jobId} for user ${userId}`);

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

      // Mark job as running
      await prisma.bulkDownloadJob.update({
        where: { id: jobId },
        data: {
          status: BULK_DOWNLOAD_CONFIG.JOB_STATUS.RUNNING,
          startedAt: new Date()
        }
      });

      // Get table columns for data mapping
      const table = await prisma.userTable.findUnique({
        where: { id: tableId },
        include: { columns: { orderBy: { order: 'asc' } } }
      });

      if (!table) {
        throw new Error('Table not found');
      }

      const columnMap = new Map(table.columns.map((col: any) => [col.name, col]));
      let totalProcessed = 0;

      // Process pages in batches for better performance
      await this.processPagesInBatches(
        apiKey,
        searchQuery,
        totalPages,
        tableId,
        columnMap,
        jobId,
        userId,
        job,
        totalProcessed
      );

    } catch (error: any) {
      console.error(`Error in bulk download job ${jobId}:`, error);

      // Mark job as failed
      await prisma.bulkDownloadJob.update({
        where: { id: jobId },
        data: {
          status: BULK_DOWNLOAD_CONFIG.JOB_STATUS.FAILED,
          completedAt: new Date(),
          lastError: error.message
        }
      });

      // Unlock the table
      await prisma.userTable.update({
        where: { id: tableId },
        data: {
          isProcessing: false,
          processingJobId: null
        }
      });

      throw error;
    }
  }

  /**
   * Process multiple pages in batches for better performance
   */
  private static async processPagesInBatches(
    apiKey: string,
    searchQuery: any,
    totalPages: number,
    tableId: string,
    columnMap: Map<string, any>,
    jobId: string,
    userId: string,
    job: Job<BulkDownloadJobData>,
    initialProcessed: number
  ): Promise<void> {
    let totalProcessed = initialProcessed;

    // Process pages in batches
    for (let batchStart = 1; batchStart <= totalPages; batchStart += BULK_DOWNLOAD_CONFIG.DB_BATCH_PAGES) {
      const batchEnd = Math.min(batchStart + BULK_DOWNLOAD_CONFIG.DB_BATCH_PAGES - 1, totalPages);

      console.log(`📦 Processing batch: pages ${batchStart}-${batchEnd} of ${totalPages} for job ${jobId}`);

      try {
        // Fetch multiple pages concurrently for better performance
        const batchPromises = [];
        for (let page = batchStart; page <= batchEnd; page++) {
          const cleanSearchQuery = { ...searchQuery };
          delete cleanSearchQuery.page;
          delete cleanSearchQuery.per_page;

          batchPromises.push(
            ApolloService.searchPeople(apiKey, {
              ...cleanSearchQuery,
              page,
              per_page: BULK_DOWNLOAD_CONFIG.APOLLO_PAGE_SIZE
            })
          );
        }

        console.log(`🚀 Fetching ${batchPromises.length} pages concurrently...`);
        const apiStartTime = Date.now();
        const batchResults = await Promise.all(batchPromises);
        console.log(`⚡ API calls completed in ${Date.now() - apiStartTime}ms`);

        // Combine all people from the batch
        const allPeople: any[] = [];
        batchResults.forEach(result => {
          allPeople.push(...result.people);
        });

        if (allPeople.length === 0) {
          console.log(`⚠️  No data in batch ${batchStart}-${batchEnd}, skipping...`);
          continue;
        }

        console.log(`📊 Batch ${batchStart}-${batchEnd}: Processing ${allPeople.length} records for bulk insertion`);

        // Bulk insert all rows for this batch
        const rowsData = allPeople.map((person: any, index: number) => ({
          tableId,
          order: totalProcessed + index + 1
        }));

        console.log(`📥 Batch ${batchStart}-${batchEnd}: Bulk inserting ${rowsData.length} rows...`);
        const rowInsertStart = Date.now();

        await prisma.tableRow.createMany({
          data: rowsData,
          skipDuplicates: true
        });

        console.log(`✅ Batch ${batchStart}-${batchEnd}: Rows inserted in ${Date.now() - rowInsertStart}ms`);

        // Fetch the created rows to get their IDs
        const createdRows = await prisma.tableRow.findMany({
          where: {
            tableId,
            order: {
              gte: totalProcessed + 1,
              lte: totalProcessed + allPeople.length
            }
          },
          orderBy: { order: 'asc' },
          select: { id: true, order: true }
        });

        // Prepare all cell data for bulk insert
        const allCellsData: any[] = [];
        createdRows.forEach((row: any, index: number) => {
          const person = allPeople[index];
          const cellsForThisRow = [
            { rowId: row.id, ...this.createCell(columnMap, 'First Name', person.first_name || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Last Name', person.last_name || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Email', person.email || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Phone', person.phone || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Title', person.title || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Company', person.organization?.name || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'LinkedIn', person.linkedin_url || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Location', person.organization?.locations?.[0]?.name || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Seniority', person.seniority || '') },
            { rowId: row.id, ...this.createCell(columnMap, 'Department', person.departments?.join(', ') || '') }
          ].filter(cell => cell.columnId);

          allCellsData.push(...cellsForThisRow);
        });

        // Bulk insert all cells for this batch
        if (allCellsData.length > 0) {
          console.log(`📥 Batch ${batchStart}-${batchEnd}: Bulk inserting ${allCellsData.length} cells...`);
          const cellInsertStart = Date.now();

          await prisma.tableCell.createMany({
            data: allCellsData,
            skipDuplicates: true
          });

          console.log(`✅ Batch ${batchStart}-${batchEnd}: Cells inserted in ${Date.now() - cellInsertStart}ms`);
        }

        // Update counters
        totalProcessed += allPeople.length;
        console.log(`🎯 Batch ${batchStart}-${batchEnd}: Batch complete. Total processed: ${totalProcessed}`);

        // Update job progress
        await prisma.bulkDownloadJob.update({
          where: { id: jobId },
          data: {
            totalProcessed,
            currentPage: batchEnd
          }
        });

        // Record progress for each page in the batch
        for (let page = batchStart; page <= batchEnd; page++) {
          const pageIndex = page - batchStart;
          const pageRecords = pageIndex < batchResults.length ? batchResults[pageIndex].people.length : 0;

          await prisma.bulkDownloadProgress.create({
            data: {
              jobId,
              page,
              recordCount: pageRecords,
              status: BULK_DOWNLOAD_CONFIG.PROGRESS_STATUS.COMPLETED
            }
          });
        }

        // Send progress updates
        const currentJobInfo = await BulkDownloadService.getJobInfo(jobId);
        if (currentJobInfo) {
          job.progress(currentJobInfo.progress.percentage);
          WebSocketService.sendJobProgress(userId, currentJobInfo);
          console.log(`📊 Batch ${batchStart}-${batchEnd}: Progress updated to ${currentJobInfo.progress.percentage}%`);
        }

        // Add delay between batches to respect rate limits
        if (batchEnd < totalPages) {
          await this.delay(BULK_DOWNLOAD_CONFIG.APOLLO_API_DELAY_MS);
        }

      } catch (batchError: any) {
        console.error(`❌ Error processing batch ${batchStart}-${batchEnd} of job ${jobId}:`, batchError);

        // Record failed pages
        for (let page = batchStart; page <= batchEnd; page++) {
          await prisma.bulkDownloadProgress.create({
            data: {
              jobId,
              page,
              recordCount: 0,
              status: BULK_DOWNLOAD_CONFIG.PROGRESS_STATUS.FAILED,
              error: batchError.message
            }
          });
        }

        // Update failure count
        const updatedJob = await prisma.bulkDownloadJob.update({
          where: { id: jobId },
          data: {
            failureCount: { increment: 1 },
            lastError: `Batch ${batchStart}-${batchEnd}: ${batchError.message}`
          }
        });

        // If we've exceeded max retries, fail the job
        if (updatedJob.failureCount >= BULK_DOWNLOAD_CONFIG.MAX_RETRY_ATTEMPTS) {
          throw new Error(`Job failed after ${BULK_DOWNLOAD_CONFIG.MAX_RETRY_ATTEMPTS} retries. Last error: ${batchError.message}`);
        }

        // Continue with next batch
        continue;
      }
    }

    // VERIFY COMPLETION: Check actual database records before marking as complete
    console.log(`🔍 Verifying job completion - expected: ${totalProcessed} records`);

    const actualRowCount = await prisma.tableRow.count({
      where: { tableId }
    });

    const actualCellCount = await prisma.tableCell.count({
      where: {
        row: { tableId }
      }
    });

    console.log(`📊 Database verification: ${actualRowCount} rows, ${actualCellCount} cells for ${totalProcessed} processed records`);

    // Only mark as completed if database records match expectations
    if (actualRowCount !== totalProcessed) {
      throw new Error(`Data verification failed: Expected ${totalProcessed} rows but found ${actualRowCount} in database`);
    }

    // Mark job as completed
    await prisma.bulkDownloadJob.update({
      where: { id: jobId },
      data: {
        status: BULK_DOWNLOAD_CONFIG.JOB_STATUS.COMPLETED,
        completedAt: new Date(),
        totalProcessed: actualRowCount
      }
    });

    // Unlock the table
    await prisma.userTable.update({
      where: { id: tableId },
      data: {
        isProcessing: false,
        processingJobId: null
      }
    });

    console.log(`✅ Bulk download job ${jobId} completed successfully with ${actualRowCount} records`);

    // Send completion notification via WebSocket
    const completedJobInfo = await BulkDownloadService.getJobInfo(jobId);
    if (completedJobInfo) {
      WebSocketService.sendJobComplete(userId, completedJobInfo);
    }
  }

  /**
   * Create a table cell data object
   */
  private static createCell(columnMap: Map<string, any>, columnName: string, value: string) {
    const column = columnMap.get(columnName);
    if (!column) {
      return { columnId: null, value: null };
    }

    return {
      columnId: column.id,
      value: value || null
    };
  }

  /**
   * Add delay between requests
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 