import { Server } from 'http';
import WebSocket from 'ws';
import { BulkDownloadJobInfo } from './bulkDownloadService';

// Generic job info interface that can handle different job types
export interface GenericJobInfo {
  id: string;
  type?: 'bulk_download' | 'ai_task';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    // Bulk download progress
    currentPage?: number;
    totalPages?: number;
    processedRecords?: number;
    totalEstimated?: number;
    // AI task progress
    completed?: number;
    failed?: number;
    total?: number;
    // Common
    percentage: number;
  };
  message?: string;
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export type JobInfo = BulkDownloadJobInfo | GenericJobInfo;

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private static wss: WebSocket.Server;
  private static clients: Map<string, Set<WebSocketClient>> = new Map();

  /**
   * Initialize WebSocket server
   */
  static initialize(server: Server) {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws',
      // Railway WebSocket configuration
      perMessageDeflate: false,
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocketClient, req) => {
      console.log('WebSocket client connected');
      
      ws.isAlive = true;
      
      // Heartbeat mechanism
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'auth' && data.userId) {
            // Check if user already has this connection authenticated
            if (ws.userId === data.userId) {
              console.log(`WebSocket client already authenticated for user: ${data.userId}`);
              return;
            }
            
            ws.userId = data.userId;
            
            // Add client to user's set
            if (!this.clients.has(data.userId)) {
              this.clients.set(data.userId, new Set());
            }
            this.clients.get(data.userId)!.add(ws);
            
            console.log(`WebSocket client authenticated for user: ${data.userId} (${this.getClientCount(data.userId)} total connections)`);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'WebSocket connection authenticated'
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    // Heartbeat check every 30 seconds
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (!ws.isAlive) {
          console.log('Terminating dead WebSocket connection');
          this.removeClient(ws);
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized');
  }

  /**
   * Remove client from tracking
   */
  private static removeClient(ws: WebSocketClient) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
  }

  /**
   * Send job progress update to user
   */
  static sendJobProgress(userId: string, jobInfo: JobInfo) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return; // No clients connected for this user
    }

    const message = JSON.stringify({
      type: 'job_progress',
      data: jobInfo
    });

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.removeClient(client);
        }
      } else {
        this.removeClient(client);
      }
    });
  }

  /**
   * Send job completion notification
   */
  static sendJobComplete(userId: string, jobInfo: JobInfo) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'job_complete',
      data: jobInfo
    });

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.removeClient(client);
        }
      } else {
        this.removeClient(client);
      }
    });
  }

  /**
   * Send job failure notification
   */
  static sendJobFailed(userId: string, jobInfo: JobInfo) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`No clients found for user ${userId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'job_failed',
      data: jobInfo
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`❌ Sent job failure to user ${userId}:`, jobInfo.id, jobInfo.error);
  }

  /**
   * Send real-time cell update notification
   */
  static sendCellUpdate(userId: string, cellUpdate: { cellId: string; value: string; timestamp: string }) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`No clients found for user ${userId} for cell update`);
      return;
    }

    const message = JSON.stringify({
      type: 'cell_update',
      data: cellUpdate
    });

    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`📱 Sent cell update to user ${userId}:`, cellUpdate.cellId);
  }

  /**
   * Get number of connected clients for a user
   */
  static getClientCount(userId: string): number {
    const userClients = this.clients.get(userId);
    return userClients ? userClients.size : 0;
  }

  /**
   * Get total number of connected clients
   */
  static getTotalClientCount(): number {
    let total = 0;
    this.clients.forEach((clients) => {
      total += clients.size;
    });
    return total;
  }
} 