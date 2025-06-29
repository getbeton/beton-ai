import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
