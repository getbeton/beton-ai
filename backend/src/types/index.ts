export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// New Integration-based types
export interface Integration {
  id: string;
  userId: string;
  serviceName: string;
  name: string;
  isActive: boolean;
  lastHealthCheck?: Date | null;
  healthStatus: string; // 'healthy' | 'unhealthy' | 'unknown' but allowing any string for flexibility
  keySource: string; // 'personal' | 'platform'
  platformKeyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys?: ApiKey[];
  platformKey?: PlatformApiKey | null;
}

export interface ApiKey {
  id: string;
  integrationId: string;
  apiKey: string;
  keyType: string; // 'platform' | 'personal'
  isActive: boolean;
  lastUsed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// New Platform API Key types
export interface PlatformApiKey {
  id: string;
  serviceName: string;
  apiKey: string; // This should only be accessible by backend
  isActive: boolean;
  description?: string | null;
  rateLimit?: number | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface CreateIntegrationRequest {
  serviceName: string;
  name: string;
  keySource: 'personal' | 'platform';
  platformKeyId?: string; // Required if keySource is 'platform'
  apiKeys?: {
    apiKey: string;
    keyType: 'platform' | 'personal';
  }[]; // Required if keySource is 'personal'
}

export interface UpdateIntegrationRequest {
  name?: string;
  isActive?: boolean;
  keySource?: 'personal' | 'platform';
  platformKeyId?: string;
}

export interface CreateApiKeyRequest {
  integrationId: string;
  apiKey: string;
  keyType: 'platform' | 'personal';
}

export interface UpdateApiKeyRequest {
  apiKey?: string;
  isActive?: boolean;
}

// Platform API Key management (backend-only)
export interface CreatePlatformApiKeyRequest {
  serviceName: string;
  apiKey: string;
  description?: string;
  rateLimit?: number;
}

export interface UpdatePlatformApiKeyRequest {
  apiKey?: string;
  isActive?: boolean;
  description?: string;
  rateLimit?: number;
}

// Legacy types (for backward compatibility)
export interface ApiKeyData {
  id: string;
  userId: string;
  serviceName: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 