import axios from 'axios';
import { supabase } from './supabase';

// Create axios instance with base configuration
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Types
export interface ApiKey {
  id: string;
  keyType: 'platform' | 'personal';
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformApiKey {
  id: string;
  serviceName: string;
  isActive: boolean;
  description: string | null;
  rateLimit: number | null;
  usageCount: number;
}

export interface Integration {
  id: string;
  userId: string;
  serviceName: string;
  name: string;
  isActive: boolean;
  lastHealthCheck: string | null;
  healthStatus: string;
  keySource: 'personal' | 'platform';
  platformKeyId: string | null;
  createdAt: string;
  updatedAt: string;
  apiKeys?: ApiKey[];
  platformKey?: PlatformApiKey | null;
}

export interface CreateIntegrationRequest {
  serviceName: string;
  name: string;
  keySource: 'personal' | 'platform';
  platformKeyId?: string;
  apiKeys?: {
    apiKey: string;
    keyType: 'platform' | 'personal';
  }[];
}

export interface UpdateIntegrationRequest {
  name?: string;
  isActive?: boolean;
  keySource?: 'personal' | 'platform';
  platformKeyId?: string;
}

export interface HealthCheckResponse {
  isHealthy: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  responseTime?: number;
  credits?: number;
  verifier_credits?: number;
}

// Table Management Types
export interface UserTable {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sourceType: string;
  sourceId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  columns?: TableColumn[];
  rows?: TableRow[];
  formattedRows?: Record<string, any>[];
  totalRows?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  _count?: {
    columns: number;
    rows: number;
  };
}

export interface TableColumn {
  id: string;
  tableId: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'checkbox' | 'ai_task';
  isRequired: boolean;
  isEditable: boolean;
  defaultValue?: string;
  order: number;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TableRow {
  id: string;
  tableId: string;
  sourceRowId?: string;
  isSelected: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  cells?: TableCell[];
}

export interface TableCell {
  id: string;
  rowId: string;
  columnId: string;
  value?: string;
  createdAt: string;
  updatedAt: string;
  column?: TableColumn;
}

export interface CreateTableRequest {
  name: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
  columns?: {
    name: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'checkbox';
    isRequired?: boolean;
    isEditable?: boolean;
    defaultValue?: string;
    settings?: Record<string, any>;
  }[];
}

export interface UpdateTableRequest {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateColumnRequest {
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'checkbox' | 'ai_task';
  isRequired?: boolean;
  isEditable?: boolean;
  defaultValue?: string;
  settings?: Record<string, any>;
}

export interface TableFilter {
  columnId: string;
  condition: string;
  value: string;
  value2?: string; // For between conditions
}

// API methods
export const apiClient = {
  // Auth endpoints
  auth: {
    verify: () => api.post('/api/auth/verify'),
    profile: () => api.get('/api/auth/profile'),
  },

  // Integrations endpoints
  integrations: {
    list: (): Promise<{ data: { success: boolean; data: Integration[] } }> => 
      api.get('/api/integrations'),
    
    get: (id: string): Promise<{ data: { success: boolean; data: Integration } }> => 
      api.get(`/api/integrations/${id}`),
    
    create: (data: CreateIntegrationRequest): Promise<{ data: { success: boolean; data: Integration } }> => 
      api.post('/api/integrations', data),
    
    update: (id: string, data: UpdateIntegrationRequest): Promise<{ data: { success: boolean; data: Integration } }> => 
      api.put(`/api/integrations/${id}`, data),
    
    delete: (id: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/integrations/${id}`),
    
    healthCheck: (id: string): Promise<{ data: { success: boolean; data: HealthCheckResponse } }> => 
      api.post(`/api/integrations/${id}/health-check`),

    // Validate API key for a service (before creating integration)
    validateKey: (data: { serviceName: string; apiKey: string }): Promise<{ data: { success: boolean; data: any; message: string } }> => 
      api.post('/api/integrations/validate-key', data),

    // Get available platform keys for a service
    getPlatformKeys: (serviceName: string): Promise<{ data: { success: boolean; data: PlatformApiKey[] } }> => 
      api.get(`/api/integrations/platform-keys/${serviceName}`),

    // Apollo People Search
    apolloPeopleSearch: (integrationId: string, filters: any): Promise<{ data: { success: boolean; data: any } }> => 
      api.post(`/api/integrations/${integrationId}/apollo/people-search`, { filters }),

    // OpenAI Text Generation
    openaiTextGeneration: (integrationId: string, request: { prompt: string; model?: string; maxTokens?: number; temperature?: number; systemPrompt?: string }): Promise<{ data: { success: boolean; data: any } }> => 
      api.post(`/api/integrations/${integrationId}/openai/text-generation`, { request }),

    // LeadMagic Email Finder
    leadmagicFindEmail: (integrationId: string, request: { firstName: string; lastName: string; domain?: string; companyName?: string }): Promise<{ data: { success: boolean; data: any } }> => 
      api.post(`/api/integrations/${integrationId}/leadmagic/find-email`, request),

    // Findymail Email Finder
    findymailFindEmail: async (integrationId: string, params: { name: string; domain: string }) => {
      // Get auth token manually for fetch request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/integrations/${integrationId}/findymail/find-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to find email');
      }

      return response.json();
    },

    // Findymail Health Check
    findymailHealthCheck: async (integrationId: string) => {
      // Get auth token manually for fetch request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/integrations/${integrationId}/findymail/health-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Health check failed');
      }

      return response.json();
    },
  },

  // Platform API Keys endpoints (admin only)
  platformKeys: {
    list: (): Promise<{ data: { success: boolean; data: PlatformApiKey[] } }> => 
      api.get('/api/platform-keys'),
    
    getByService: (serviceName: string): Promise<{ data: { success: boolean; data: PlatformApiKey[] } }> => 
      api.get(`/api/platform-keys/service/${serviceName}`),
    
    create: (data: {
      serviceName: string;
      apiKey: string;
      description?: string;
      rateLimit?: number;
    }): Promise<{ data: { success: boolean; data: PlatformApiKey } }> => 
      api.post('/api/platform-keys', data),
    
    update: (id: string, data: {
      apiKey?: string;
      isActive?: boolean;
      description?: string;
      rateLimit?: number;
    }): Promise<{ data: { success: boolean; data: PlatformApiKey } }> => 
      api.put(`/api/platform-keys/${id}`, data),
    
    delete: (id: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/platform-keys/${id}`),

    getStats: (): Promise<{ data: { success: boolean; data: any[] } }> => 
      api.get('/api/platform-keys/stats'),
  },

  // Table Management endpoints
  tables: {
    list: (archived = false): Promise<{ data: { success: boolean; data: UserTable[] } }> => 
      api.get(`/api/tables?archived=${archived}`),

    get: (id: string, options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      filters?: TableFilter[];
    }): Promise<{ data: { success: boolean; data: UserTable } }> => {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options?.search) params.append('search', options.search);
      if (options?.filters && options.filters.length > 0) {
        params.append('filters', JSON.stringify(options.filters));
      }
      
      const queryString = params.toString();
      return api.get(`/api/tables/${id}${queryString ? `?${queryString}` : ''}`);
    },

    create: (data: CreateTableRequest): Promise<{ data: { success: boolean; data: UserTable } }> => 
      api.post('/api/tables', data),

    update: (id: string, data: UpdateTableRequest): Promise<{ data: { success: boolean; data: UserTable } }> => 
      api.put(`/api/tables/${id}`, data),

    delete: (id: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/tables/${id}`),

    // Column management
    addColumn: (tableId: string, data: CreateColumnRequest): Promise<{ data: { success: boolean; data: TableColumn } }> => 
      api.post(`/api/tables/${tableId}/columns`, data),

    updateColumn: (tableId: string, columnId: string, data: Partial<CreateColumnRequest>): Promise<{ data: { success: boolean; data: TableColumn } }> => 
      api.put(`/api/tables/${tableId}/columns/${columnId}`, data),

    deleteColumn: (tableId: string, columnId: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/tables/${tableId}/columns/${columnId}`),

    // Row management
    addRow: (tableId: string, data: Record<string, any>): Promise<{ data: { success: boolean; data: TableRow } }> => 
      api.post(`/api/tables/${tableId}/rows`, { data }),

    bulkAddRows: (tableId: string, rows: Record<string, any>[]): Promise<{ data: { success: boolean; data: TableRow[] } }> => 
      api.post(`/api/tables/${tableId}/rows/bulk`, { rows }),

    deleteRow: (tableId: string, rowId: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/tables/${tableId}/rows/${rowId}`),

    // Cell management
    updateCell: (tableId: string, rowId: string, columnId: string, value: any): Promise<{ data: { success: boolean; data: TableCell } }> => 
      api.put(`/api/tables/${tableId}/rows/${rowId}/cells/${columnId}`, { value }),

    // Import from Apollo
    importFromApollo: (tableId: string, searchResults: any): Promise<{ data: { success: boolean; data: TableRow[] } }> => 
      api.post(`/api/tables/${tableId}/import/apollo`, { searchResults }),

    // CSV Upload
    uploadCSV: async (file: File, tableName?: string): Promise<{ data: { success: boolean; data: { jobId: string; tableId: string; tableName: string } } }> => {
      const formData = new FormData();
      formData.append('file', file);
      if (tableName) formData.append('tableName', tableName);
      
      // Get auth token manually for FormData request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${baseURL}/api/tables/upload-csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          // Don't set Content-Type - let browser set it for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
  },

  // Legacy API Keys endpoints (for backward compatibility if needed)
  apiKeys: {
    list: (): Promise<{ data: { success: boolean; data: Integration[] } }> => 
      api.get('/api/integrations'), // Redirect to integrations
    
    create: (data: any): Promise<{ data: { success: boolean; data: Integration } }> => {
      // Convert old format to new integration format
      const integrationData: CreateIntegrationRequest = {
        serviceName: data.serviceName || 'apollo',
        name: data.serviceName || 'Default Integration',
        keySource: 'personal',
        apiKeys: [{
          apiKey: data.apiKey,
          keyType: 'personal'
        }]
      };
      return api.post('/api/integrations', integrationData);
    },
    
    delete: (id: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/api/integrations/${id}`),
  },

  // AI Task endpoints
  aiTasks: {
    execute: (data: CreateAiTaskJobRequest): Promise<{ data: { success: boolean; data: { jobId: string } } }> => 
      api.post('/api/ai-tasks/execute', data),

    getJobStatus: (jobId: string): Promise<{ data: { success: boolean; data: AiTaskJob } }> => 
      api.get(`/api/ai-tasks/jobs/${jobId}`),

    cancelJob: (jobId: string): Promise<{ data: { success: boolean } }> => 
      api.post(`/api/ai-tasks/jobs/${jobId}/cancel`),

    listJobs: (params?: { status?: string; limit?: number; offset?: number }): Promise<{ data: { success: boolean; data: AiTaskJob[] } }> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      const query = searchParams.toString();
      return api.get(`/api/ai-tasks/jobs${query ? `?${query}` : ''}`);
    },

    validateColumn: (settings: any): Promise<{ data: { success: boolean; data: { isValid: boolean; errors: string[] } } }> => 
      api.post('/api/ai-tasks/validate-column', { settings }),

    getAvailableVariables: (tableId: string): Promise<{ data: { success: boolean; data: { variables: string[] } } }> => 
      api.get(`/api/ai-tasks/tables/${tableId}/variables`),

    getExecutions: (jobId: string, params?: { status?: string; limit?: number; offset?: number }): Promise<{ data: { success: boolean; data: AiTaskExecution[] } }> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      const query = searchParams.toString();
      return api.get(`/api/ai-tasks/jobs/${jobId}/executions${query ? `?${query}` : ''}`);
    },
  },
};

// LeadMagic API endpoints
export const leadmagicApi = {
  checkHealth: async (apiKey: string): Promise<{ data: { success: boolean; data: HealthCheckResponse } }> => {
    return api.get('/api/leadmagic/health', {
      headers: {
        'X-LeadMagic-API-Key': apiKey
      }
    });
  },

  findEmail: async (apiKey: string, data: {
    firstName: string;
    lastName: string;
    domain?: string;
    companyName?: string;
  }): Promise<{ data: { success: boolean; data: any } }> => {
    return api.post('/api/leadmagic/find-email', data, {
      headers: {
        'X-LeadMagic-API-Key': apiKey
      }
    });
  }
};

// AI Task API
export const aiTaskApi = {
  // Get AI task jobs
  getJobs: async (): Promise<{ data: { success: boolean; data: AiTaskJob[] } }> => {
    return api.get('/api/ai-tasks/jobs');
  },

  // Get specific AI task job
  getJob: async (jobId: string): Promise<{ data: { success: boolean; data: AiTaskJob } }> => {
    return api.get(`/api/ai-tasks/jobs/${jobId}`);
  },

  // Cancel AI task job  
  cancelJob: async (jobId: string): Promise<{ data: { success: boolean } }> => {
    return api.post(`/api/ai-tasks/jobs/${jobId}/cancel`);
  },

  // Get AI task executions for a job
  getJobExecutions: async (jobId: string): Promise<{ data: { success: boolean; data: AiTaskExecution[] } }> => {
    return api.get(`/api/ai-tasks/jobs/${jobId}/executions`);
  }
};

// AI Task types
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
  prompt?: string;
  modelConfig?: any;
  executionScope: 'column' | 'selected_rows' | 'single_row' | 'single_cell';
  targetRowIds?: string[];
  targetCellId?: string;
}

export interface AiTaskJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  executionScope: string;
  tableName: string;
  columnName: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AiTaskExecution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  rowOrder: number;
  columnName: string;
  result?: string;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  executedAt?: string;
  createdAt: string;
}

export default api; 