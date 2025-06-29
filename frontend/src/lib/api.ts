import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create axios instance with base configuration
const baseURL = 'http://localhost:3001';

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
  type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'checkbox';
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
  type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'checkbox';
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
};

export default api; 