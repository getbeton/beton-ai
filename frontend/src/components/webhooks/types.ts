/**
 * Webhook Types
 * 
 * Shared TypeScript types and interfaces for webhook components.
 * Includes types for incoming webhooks, outbound webhooks, deliveries,
 * and configuration objects.
 */

// ============================================================================
// INCOMING WEBHOOK TYPES
// ============================================================================

export interface IncomingWebhook {
  id: string;
  userId: string;
  tableId: string;
  url: string;
  apiKey: string; // API key for authenticating webhook requests
  isActive: boolean;
  fieldMapping: Record<string, string>; // { jsonField: columnId }
  createdAt: string;
  updatedAt: string;
  receivedCount?: number;
  lastReceivedAt?: string | null;
}

export interface CreateIncomingWebhookRequest {
  tableId: string;
  fieldMapping: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateIncomingWebhookRequest {
  fieldMapping?: Record<string, string>;
  isActive?: boolean;
}

export interface IncomingWebhookTestRequest {
  payload: any;
}

export interface IncomingWebhookTestResult {
  success: boolean;
  mappedData: Record<string, any>;
  message: string;
  errors?: string[];
}

// ============================================================================
// OUTBOUND WEBHOOK TYPES
// ============================================================================

export interface OutboundWebhook {
  id: string;
  userId: string;
  tableId: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secretKey?: string | null;
  retryCount: number;
  timeout: number;
  createdAt: string;
  updatedAt: string;
  lastDeliveryAt?: string | null;
  deliveryCount?: number;
  successCount?: number;
  failureCount?: number;
}

export type WebhookEvent = 'row.created' | 'row.updated' | 'row.deleted';

export interface CreateOutboundWebhookRequest {
  tableId: string;
  url: string;
  events: WebhookEvent[];
  isActive?: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface UpdateOutboundWebhookRequest {
  url?: string;
  events?: WebhookEvent[];
  isActive?: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface OutboundWebhookTestRequest {
  webhookId: string;
}

export interface OutboundWebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  responseBody?: any;
  error?: string;
}

// ============================================================================
// WEBHOOK DELIVERY TYPES
// ============================================================================

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  statusCode: number | null;
  responseBody: string | null;
  responseTime: number | null;
  success: boolean;
  attempt: number;
  error: string | null;
  createdAt: string;
}

export interface WebhookDeliveryListResponse {
  success: boolean;
  data: WebhookDelivery[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface WebhookModalState {
  isOpen: boolean;
  activeTab: 'setup' | 'test' | 'manage' | 'configuration' | 'deliveries' | 'settings';
  isLoading: boolean;
  error: string | null;
}

export interface FieldMappingItem {
  sourceField: string;
  targetColumnId: string;
  targetColumnName: string;
}

// ============================================================================
// TABLE COLUMN TYPE (for field mapping)
// ============================================================================

export interface TableColumn {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateWebhookUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    const parsed = new URL(url);
    
    // Must be HTTP(S)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Block localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return { valid: false, error: 'Localhost URLs not allowed in production' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const validateJSON = (jsonString: string): { valid: boolean; parsed?: any; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'JSON must be an object' };
    }
    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};


