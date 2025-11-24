/**
 * Webhook Routes
 * 
 * Handles both incoming and outbound webhook endpoints.
 * 
 * Incoming Webhooks:
 * - Receive data from external services
 * - Map fields to table columns
 * - Create rows automatically
 * 
 * Outbound Webhooks:
 * - Send data to external URLs
 * - Trigger on table events (row.created, row.updated, row.deleted)
 * - Track delivery history
 */

import express, { Request, Response } from 'express';

import { authMiddleware } from '../middleware/auth';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
import prisma from '../lib/prisma';

/**
 * Generate a secure API key for webhook authentication
 * Format: whk_live_<32_random_hex_chars>
 */
function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16);
  const hexString = randomBytes.toString('hex');
  return `whk_live_${hexString}`;
}

// ============================================================================
// INCOMING WEBHOOK ROUTES
// ============================================================================

/**
 * Create incoming webhook
 * POST /api/webhooks
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tableId, fieldMapping, isActive = true } = req.body;
    const userId = (req as any).user.userId;

    // Validate table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id: tableId, userId },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      });
    }

    // Check if webhook already exists for this table
    const existing = await prisma.incomingWebhook.findUnique({
      where: { tableId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Webhook already exists for this table',
      });
    }

    // Generate unique webhook URL
    const uniqueId = `${tableId}_${Date.now()}`;
    const webhookUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/webhooks/receive/${uniqueId}`;

    // Generate secure API key for webhook authentication
    const apiKey = generateApiKey();

    // Create webhook
    const webhook = await prisma.incomingWebhook.create({
      data: {
        userId,
        tableId,
        url: webhookUrl,
        apiKey,
        isActive,
        fieldMapping,
      },
    });

    console.log(`[Webhooks] Created incoming webhook: ${webhook.id} for table: ${tableId}`);

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('[Webhooks] Create incoming webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhook',
    });
  }
});

/**
 * List all incoming webhooks
 * GET /api/webhooks
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const webhooks = await prisma.incomingWebhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    console.error('[Webhooks] List incoming webhooks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list webhooks',
    });
  }
});

/**
 * Get incoming webhook for table
 * GET /api/webhooks/table/:tableId
 */
router.get('/table/:tableId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const userId = (req as any).user.userId;

    // Verify table belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id: tableId, userId },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      });
    }

    const webhook = await prisma.incomingWebhook.findUnique({
      where: { tableId },
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('[Webhooks] Get incoming webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get webhook',
    });
  }
});

/**
 * Update incoming webhook
 * PUT /api/webhooks/:id
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fieldMapping, isActive } = req.body;
    const userId = (req as any).user.userId;

    // Verify webhook belongs to user
    const existing = await prisma.incomingWebhook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Update webhook
    const webhook = await prisma.incomingWebhook.update({
      where: { id },
      data: {
        fieldMapping: fieldMapping !== undefined ? fieldMapping : existing.fieldMapping,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    console.log(`[Webhooks] Updated incoming webhook: ${id}`);

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('[Webhooks] Update incoming webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update webhook',
    });
  }
});

/**
 * Delete incoming webhook
 * DELETE /api/webhooks/:id
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify webhook belongs to user
    const existing = await prisma.incomingWebhook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Delete webhook
    await prisma.incomingWebhook.delete({
      where: { id },
    });

    console.log(`[Webhooks] Deleted incoming webhook: ${id}`);

    res.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[Webhooks] Delete incoming webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete webhook',
    });
  }
});

/**
 * Receive webhook data (public endpoint with API key authentication)
 * POST /api/webhooks/receive/:uniqueId
 * 
 * Authentication: Requires API key in request headers
 * Header: x-api-key: whk_live_<your_key>
 * 
 * This endpoint receives data from external services and creates rows in the table.
 * It automatically creates columns for any new payload keys that aren't mapped yet.
 */
router.post('/receive/:uniqueId', async (req: Request, res: Response) => {
  try {
    const { uniqueId } = req.params;
    const payload = req.body;

    // Extract API key from headers
    const apiKey = req.headers['x-api-key'] as string;

    console.log(`[Webhooks] Received webhook data for: ${uniqueId}`);

    // Validate API key is provided
    if (!apiKey) {
      console.log(`[Webhooks] Missing API key for webhook: ${uniqueId}`);
      return res.status(401).json({
        success: false,
        error: 'Missing API key. Please provide x-api-key header.',
      });
    }

    // Find webhook by URL
    const webhookUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/webhooks/receive/${uniqueId}`;
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { url: webhookUrl },
      include: { table: { include: { columns: true } } },
    });

    if (!webhook) {
      console.log(`[Webhooks] Webhook not found: ${uniqueId}`);
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Validate API key matches
    if (webhook.apiKey !== apiKey) {
      console.log(`[Webhooks] Invalid API key for webhook: ${webhook.id}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    if (!webhook.isActive) {
      console.log(`[Webhooks] Webhook is inactive: ${webhook.id}`);
      return res.status(403).json({
        success: false,
        error: 'Webhook is inactive',
      });
    }

    // Auto-create columns for unmapped payload keys
    let fieldMapping = webhook.fieldMapping as Record<string, string>;
    const payloadKeys = Object.keys(payload);
    const unmappedKeys = payloadKeys.filter(key => !fieldMapping[key]);

    if (unmappedKeys.length > 0) {
      console.log(`[Webhooks] Auto-creating columns for unmapped keys: ${unmappedKeys.join(', ')}`);

      // Get the highest column order
      const maxOrderColumn = webhook.table.columns.reduce((max, col) =>
        col.order > max ? col.order : max, -1
      );

      // Create new columns for unmapped keys
      const newColumns = await Promise.all(
        unmappedKeys.map((key, index) =>
          prisma.tableColumn.create({
            data: {
              tableId: webhook.tableId,
              name: key,
              type: 'text',
              order: maxOrderColumn + index + 1,
              isEditable: true,
            },
          })
        )
      );

      // Update field mapping to include new columns
      newColumns.forEach((col, index) => {
        fieldMapping[unmappedKeys[index]] = col.id;
      });

      // Update webhook with new field mapping
      await prisma.incomingWebhook.update({
        where: { id: webhook.id },
        data: { fieldMapping },
      });

      console.log(`[Webhooks] Created ${newColumns.length} new columns`);
    }

    // Map payload to table columns
    const mappedData: Record<string, any> = {};

    Object.entries(fieldMapping).forEach(([sourceField, targetColumnId]) => {
      if (payload[sourceField] !== undefined) {
        mappedData[targetColumnId] = payload[sourceField];
      }
    });

    // Get the next row order
    const maxOrderRow = await prisma.tableRow.findFirst({
      where: { tableId: webhook.tableId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderRow?.order || 0) + 1;

    // Create row with cells
    const row = await prisma.tableRow.create({
      data: {
        tableId: webhook.tableId,
        order: nextOrder,
        cells: {
          create: Object.entries(mappedData).map(([columnId, value]) => ({
            columnId,
            value: String(value),
          })),
        },
      },
      include: { cells: true },
    });

    // Update webhook stats
    await prisma.incomingWebhook.update({
      where: { id: webhook.id },
      data: {
        receivedCount: { increment: 1 },
        lastReceivedAt: new Date(),
      },
    });

    console.log(`[Webhooks] Created row from webhook: ${row.id}`);

    res.json({
      success: true,
      data: {
        rowId: row.id,
        mappedData,
        columnsCreated: unmappedKeys.length,
      },
    });
  } catch (error: any) {
    console.error('[Webhooks] Receive webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook',
    });
  }
});

// ============================================================================
// OUTBOUND WEBHOOK ROUTES
// ============================================================================

/**
 * Create outbound webhook
 * POST /api/webhooks/outbound
 */
router.post('/outbound', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tableId, url, events, isActive = true, retryCount, timeout } = req.body;
    const userId = (req as any).user.userId;

    // Validate table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id: tableId, userId },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook URL',
      });
    }

    // Validate events
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one event is required',
      });
    }

    const validEvents = ['row.created', 'row.updated', 'row.deleted'];
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid events: ${invalidEvents.join(', ')}`,
      });
    }

    // Create webhook
    const webhook = await prisma.outboundWebhook.create({
      data: {
        userId,
        tableId,
        url,
        events,
        isActive,
        retryCount: retryCount || 3,
        timeout: timeout || 30000,
      },
    });

    console.log(`[Webhooks] Created outbound webhook: ${webhook.id} for table: ${tableId}`);

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('[Webhooks] Create outbound webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhook',
    });
  }
});

/**
 * List outbound webhooks
 * GET /api/webhooks/outbound?tableId=xxx
 */
router.get('/outbound', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tableId } = req.query;
    const userId = (req as any).user.userId;

    const where: any = { userId };
    if (tableId) {
      where.tableId = tableId as string;
    }

    const webhooks = await prisma.outboundWebhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    console.error('[Webhooks] List outbound webhooks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list webhooks',
    });
  }
});

/**
 * Update outbound webhook
 * PUT /api/webhooks/outbound/:id
 */
router.put('/outbound/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { url, events, isActive, retryCount, timeout } = req.body;
    const userId = (req as any).user.userId;

    // Verify webhook belongs to user
    const existing = await prisma.outboundWebhook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook URL',
        });
      }
    }

    // Update webhook
    const webhook = await prisma.outboundWebhook.update({
      where: { id },
      data: {
        url: url || existing.url,
        events: events || existing.events,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        retryCount: retryCount !== undefined ? retryCount : existing.retryCount,
        timeout: timeout !== undefined ? timeout : existing.timeout,
      },
    });

    console.log(`[Webhooks] Updated outbound webhook: ${id}`);

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('[Webhooks] Update outbound webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update webhook',
    });
  }
});

/**
 * Delete outbound webhook
 * DELETE /api/webhooks/outbound/:id
 */
router.delete('/outbound/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify webhook belongs to user
    const existing = await prisma.outboundWebhook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Delete webhook (deliveries will cascade)
    await prisma.outboundWebhook.delete({
      where: { id },
    });

    console.log(`[Webhooks] Deleted outbound webhook: ${id}`);

    res.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[Webhooks] Delete outbound webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete webhook',
    });
  }
});

/**
 * Test outbound webhook
 * POST /api/webhooks/outbound/:id/test
 */
router.post('/outbound/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Get webhook
    const webhook = await prisma.outboundWebhook.findFirst({
      where: { id, userId },
      include: { table: true },
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Create test payload
    const testPayload = {
      event: 'test',
      table: webhook.table.name,
      tableId: webhook.tableId,
      row: {
        id: 'test-row-id',
        createdAt: new Date().toISOString(),
        data: {
          test: 'This is a test webhook delivery',
        },
      },
    };

    // Send test request
    const startTime = Date.now();
    try {
      const response = await axios.post(webhook.url, testPayload, {
        timeout: webhook.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Beton-AI-Webhooks/1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          success: true,
          statusCode: response.status,
          responseTime,
          responseBody: response.data,
        },
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          success: false,
          statusCode: error.response?.status || null,
          responseTime,
          error: error.message,
          responseBody: error.response?.data,
        },
      });
    }
  } catch (error: any) {
    console.error('[Webhooks] Test outbound webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test webhook',
    });
  }
});

/**
 * Get webhook deliveries
 * GET /api/webhooks/outbound/:id/deliveries
 */
router.get('/outbound/:id/deliveries', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify webhook belongs to user
    const webhook = await prisma.outboundWebhook.findFirst({
      where: { id, userId },
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    // Get recent deliveries (last 20)
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error: any) {
    console.error('[Webhooks] Get deliveries error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deliveries',
    });
  }
});

export default router;

