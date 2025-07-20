import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage, WebSocketAuthMessage, BulkDownloadJobInfo, CSVUploadProgress } from '../types/bulkDownload';

interface UseWebSocketOptions {
  userId?: string;
  onJobProgress?: (jobInfo: BulkDownloadJobInfo) => void;
  onJobComplete?: (jobInfo: BulkDownloadJobInfo) => void;
  onJobFailed?: (jobInfo: BulkDownloadJobInfo) => void;
  onCSVUploadProgress?: (progress: CSVUploadProgress) => void;
  onCSVUploadComplete?: (progress: CSVUploadProgress) => void;
  onCSVUploadFailed?: (progress: CSVUploadProgress) => void;
  onCellUpdate?: (cellUpdate: { cellId: string; value: string; timestamp: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    userId,
    onJobProgress,
    onJobComplete,
    onJobFailed,
    onCSVUploadProgress,
    onCSVUploadComplete,
    onCSVUploadFailed,
    onCellUpdate,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (!userId || wsRef.current || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    
    // Determine WebSocket URL - use WSS for production (Railway)
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    
    // If we're in production (no localhost in API URL), ensure we use WSS
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (apiUrl.includes('railway.app') && wsUrl.startsWith('ws://')) {
      wsUrl = wsUrl.replace('ws://', 'wss://');
    }
    
    console.log('Connecting to WebSocket:', wsUrl);
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        onConnect?.();

        // Authenticate the connection
        const authMessage: WebSocketAuthMessage = {
          type: 'auth',
          userId: userId
        };
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          switch (message.type) {
            case 'auth_success':
              console.log('WebSocket authentication successful');
              break;
            case 'job_progress':
              if (message.data && onJobProgress && 'createdAt' in message.data) {
                onJobProgress(message.data as BulkDownloadJobInfo);
              }
              break;
            case 'job_complete':
              if (message.data && onJobComplete && 'createdAt' in message.data) {
                onJobComplete(message.data as BulkDownloadJobInfo);
              }
              break;
            case 'job_failed':
              if (message.data && onJobFailed && 'createdAt' in message.data) {
                onJobFailed(message.data as BulkDownloadJobInfo);
              }
              break;
            case 'csv_upload_progress':
              if (message.data && onCSVUploadProgress && 'jobId' in message.data) {
                onCSVUploadProgress(message.data as CSVUploadProgress);
              }
              break;
            case 'csv_upload_complete':
              if (message.data && onCSVUploadComplete && 'jobId' in message.data) {
                onCSVUploadComplete(message.data as CSVUploadProgress);
              }
              break;
            case 'csv_upload_failed':
              if (message.data && onCSVUploadFailed && 'jobId' in message.data) {
                onCSVUploadFailed(message.data as CSVUploadProgress);
              }
              break;
            case 'cell_update':
              if (message.data && onCellUpdate && 'cellId' in message.data) {
                onCellUpdate(message.data as { cellId: string; value: string; timestamp: string });
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        isConnectingRef.current = false;
        onDisconnect?.();
        wsRef.current = null;

        // Attempt to reconnect if not closed intentionally and we still have a userId
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && userId) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      isConnectingRef.current = false;
    }
  }, [userId, onJobProgress, onJobComplete, onJobFailed, onCSVUploadProgress, onCSVUploadComplete, onCSVUploadFailed, onCellUpdate, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    isConnectingRef.current = false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttempts.current = 0;
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Effect to manage connection lifecycle
  useEffect(() => {
    // Only connect if we have a userId and we're not already connected/connecting
    if (userId && !wsRef.current && !isConnectingRef.current && connectionStatus !== 'connecting') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]); // Only depend on userId to prevent unnecessary reconnections

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    reconnect,
    disconnect
  };
}; 