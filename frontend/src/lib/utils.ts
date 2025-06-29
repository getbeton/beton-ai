import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import toast from 'react-hot-toast'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject();
      document.body.removeChild(textArea);
    });
  }
}

// File validation utilities for CSV uploads
export const validateCSVFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'Please upload a CSV file' };
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { valid: false, error: 'File too large. Maximum size is 50MB' };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  return { valid: true };
};

export const generateTableNameFromFile = (filename: string): string => {
  return filename
    .replace('.csv', '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 50); // Limit length
};

// Number formatting utility
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

// Time ago formatting utility
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label.charAt(0)} ago`;
    }
  }
  
  return 'Just now';
};

// PRD 4.3: Enhanced Error Handling Utilities
export interface ErrorContext {
  operation: string;
  entityType?: string;
  entityName?: string;
  retry?: () => void;
}

export const createUserFriendlyError = (error: any, context: ErrorContext): string => {
  const { operation, entityType = 'item', entityName } = context;
  
  // Network errors
  if (!navigator.onLine) {
    return `You're offline. Please check your internet connection and try again.`;
  }
  
  // Common HTTP errors with user-friendly messages
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return `Invalid ${operation} request. Please check your data and try again.`;
      case 401:
        return `You're not authorized to ${operation}. Please sign in and try again.`;
      case 403:
        return `You don't have permission to ${operation} this ${entityType}.`;
      case 404:
        return entityName 
          ? `${entityName} not found. It may have been deleted or moved.`
          : `${entityType} not found. It may have been deleted or moved.`;
      case 409:
        return `This ${operation} conflicts with existing data. Please refresh and try again.`;
      case 413:
        return `File too large. Please select a smaller file and try again.`;
      case 422:
        return `Invalid data format. Please check your input and try again.`;
      case 429:
        return `Too many requests. Please wait a moment and try again.`;
      case 500:
        return `Server error occurred. Please try again in a few moments.`;
      case 503:
        return `Service temporarily unavailable. Please try again later.`;
      default:
        return `Failed to ${operation}. Please try again.`;
    }
  }
  
  // File-specific errors
  if (error?.message?.includes('file')) {
    return `File upload failed. Please check your file and try again.`;
  }
  
  // Network timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return `Request timed out. Please check your connection and try again.`;
  }
  
  // Generic fallback
  return error?.message?.length > 100 
    ? `Failed to ${operation}. Please try again or contact support if the problem persists.`
    : error?.message || `Failed to ${operation}. Please try again.`;
};

export const showErrorWithRetry = (
  error: any, 
  context: ErrorContext,
  options?: { 
    duration?: number;
    actionLabel?: string;
  }
) => {
  const message = createUserFriendlyError(error, context);
  const { duration = 6000 } = options || {};
  
  // Show error message with longer duration for retry context
  toast.error(message, { duration });
  
  // If retry is available, show a follow-up instruction
  if (context.retry) {
    setTimeout(() => {
      toast('💡 Tip: You can retry this operation from the interface', {
        duration: 3000,
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      });
    }, 1000);
  }
};

export const showSuccessWithAction = (
  message: string,
  actionLabel?: string,
  action?: () => void,
  options?: { duration?: number }
) => {
  const { duration = 4000 } = options || {};
  toast.success(message, { duration });
};

// PRD 4.3: Loading State Utilities
export const createLoadingToast = (message: string, id?: string) => {
  return toast.loading(message, { id });
};

export const updateLoadingToast = (
  id: string, 
  type: 'success' | 'error', 
  message: string,
  action?: { label: string; onClick: () => void }
) => {
  if (type === 'success') {
    toast.success(message, { id });
  } else {
    toast.error(message, { id });
  }
};

// PRD 4.3: Optimistic UI Utilities
export const withOptimisticUpdate = async <T>(
  optimisticUpdate: () => void,
  apiCall: () => Promise<T>,
  revertUpdate: () => void,
  context: ErrorContext
): Promise<T> => {
  try {
    // Apply optimistic update immediately
    optimisticUpdate();
    
    // Perform actual API call
    const result = await apiCall();
    
    return result;
  } catch (error) {
    // Revert optimistic update on failure
    revertUpdate();
    
    // Show error with retry option
    showErrorWithRetry(error, {
      ...context,
      retry: async () => {
        try {
          optimisticUpdate();
          await apiCall();
        } catch (retryError) {
          revertUpdate();
          showErrorWithRetry(retryError, context);
        }
      }
    });
    
    throw error;
  }
};

// PRD 4.3: Network and Performance Utilities
export const isSlowNetwork = (): boolean => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }
  return false;
};

export const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};

// PRD 4.3: Debounce utility for search and filters
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// PRD 4.3: File size formatting utility
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// PRD 4.3: Keyboard shortcuts utility
export const handleKeyboardShortcut = (
  event: KeyboardEvent,
  shortcuts: Record<string, () => void>
) => {
  const key = `${event.ctrlKey || event.metaKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;
  
  if (shortcuts[key]) {
    event.preventDefault();
    shortcuts[key]();
  }
};

// PRD 4.3: Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
