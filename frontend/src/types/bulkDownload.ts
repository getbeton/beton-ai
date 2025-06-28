export interface BulkDownloadEstimate {
  totalRecords: number;
  totalPages: number;
  estimatedDuration: string;
  exceedsWarningThreshold: boolean;
}

export interface BulkDownloadJobProgress {
  currentPage: number;
  totalPages: number;
  processedRecords: number;
  totalEstimated: number;
  percentage: number;
}

export interface BulkDownloadJobInfo {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: BulkDownloadJobProgress;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Structured response from the jobs API
export interface BulkDownloadJobsResponse {
  all: BulkDownloadJobInfo[];
  running: BulkDownloadJobInfo[];
  completed: BulkDownloadJobInfo[];
  failed: BulkDownloadJobInfo[];
  cancelled?: BulkDownloadJobInfo[];
  summary: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    cancelled?: number;
  };
}

export interface BulkDownloadStartRequest {
  tableName: string;
  searchQuery: any;
  integrationId: string;
}

export interface BulkDownloadEstimateRequest {
  searchQuery: any;
  integrationId: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'auth_success' | 'job_progress' | 'job_complete' | 'job_failed';
  data?: BulkDownloadJobInfo;
  message?: string;
}

export interface WebSocketAuthMessage {
  type: 'auth';
  userId: string;
} 