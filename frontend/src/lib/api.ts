import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
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