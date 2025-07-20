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

// CSV Upload Progress Types
export interface CSVUploadProgress {
  jobId: string;
  status: 'uploading' | 'parsing' | 'creating_table' | 'importing_data' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    currentStep: string;
    totalSteps?: number;
    processedRows?: number;
    totalRows?: number;
  };
  tableId?: string;
  tableName?: string;
  error?: string;
}

export interface CSVUploadJobInfo {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: CSVUploadProgress;
  fileName: string;
  tableName: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'auth_success' | 'job_progress' | 'job_complete' | 'job_failed' | 'csv_upload_progress' | 'csv_upload_complete' | 'csv_upload_failed' | 'cell_update';
  data: BulkDownloadJobInfo | CSVUploadProgress | { cellId: string; value: string; timestamp: string };
}

export interface WebSocketAuthMessage {
  type: 'auth';
  userId: string;
} 