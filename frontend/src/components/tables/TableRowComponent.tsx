'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle,
  Clock,
  AlertCircle,
  Database,
  Eye,
  Edit3,
  Download,
  Copy,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { formatNumber, formatTimeAgo } from '@/lib/utils';

interface TableData {
  id: string;
  name: string;
  rows: number;
  columns: number;
  source: "CSV" | "Apollo" | "Manual";
  lastModified: Date;
  status: "processing" | "ready" | "error" | "importing";
  description?: string;
}

interface TableRowComponentProps {
  table: TableData;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onAction: (action: string, tableId: string) => void;
  showBulkActions?: boolean;
}

// Utility function to format time ago (moved from TableDashboard)
const formatTimeAgoLocal = (date: Date): string => {
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

export const TableRowComponent: React.FC<TableRowComponentProps> = ({ 
  table, 
  isSelected = false,
  onSelect,
  onAction,
  showBulkActions = false
}) => {
  const router = useRouter();

  // Enhanced status icon with animations
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "importing":
        return <Database className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Enhanced source badge with proper colors
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'CSV':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            CSV
          </Badge>
        );
      case 'Apollo':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Apollo
          </Badge>
        );
      case 'Manual':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Manual
          </Badge>
        );
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Dynamic row styling based on status and selection
  const getRowClassName = (): string => {
    const baseClasses = "hover:bg-muted/50 transition-colors relative";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-50 hover:bg-blue-100`;
    }
    
    if (table.status === "error") {
      return `${baseClasses} bg-red-50/30 hover:bg-red-50`;
    }
    
    return baseClasses;
  };

  // Action handlers
  const handleAction = useCallback((action: string) => {
    onAction(action, table.id);
  }, [onAction, table.id]);

  const isProcessing = table.status === 'processing' || table.status === 'importing';

  return (
    <TableRow className={getRowClassName()}>
      {/* Name and Status - Always visible */}
      <TableCell className="font-medium">
        <div className="flex items-center space-x-3">
          {showBulkActions && onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(table.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {getStatusIcon(table.status)}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium truncate max-w-[200px]">{table.name}</span>
                {isProcessing && (
                  <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                    {table.status === 'importing' ? 'Importing...' : 'Processing...'}
                  </span>
                )}
              </div>
              {table.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {table.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      
      {/* Rows - Hidden on mobile */}
      <TableCell className="hidden md:table-cell">
        <div className="text-right">
          <span className="font-medium">{formatNumber(table.rows)}</span>
          <span className="text-sm text-muted-foreground ml-1">rows</span>
        </div>
      </TableCell>
      
      {/* Columns - Hidden on mobile and tablet */}
      <TableCell className="hidden lg:table-cell">
        <span className="text-muted-foreground">{table.columns} columns</span>
      </TableCell>
      
      {/* Source - Hidden on mobile and tablet */}
      <TableCell className="hidden lg:table-cell">
        {getSourceBadge(table.source)}
      </TableCell>
      
      {/* Last Modified - Hidden on mobile */}
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {formatTimeAgoLocal(table.lastModified)}
      </TableCell>
      
      {/* Actions - Always visible */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction('view')}>
              <Eye className="h-4 w-4 mr-2" />
              View Table
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAction('edit')}
              disabled={isProcessing}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Structure
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('duplicate')}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction('delete')}
              className="text-red-600 focus:text-red-600"
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-700">
              {table.status === 'importing' ? 'Importing Data...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </TableRow>
  );
};

export default TableRowComponent;
