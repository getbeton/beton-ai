'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable } from '@/lib/api';
import { 
  Search,
  Plus,
  CheckSquare,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from './EmptyState';
import { UploadProgressOverlay } from './upload/UploadProgressOverlay';
import { FileUploadDropzone } from './upload/FileUploadDropzone';
import { BulkActionToolbar } from './tables/BulkActionToolbar';
import { CsvUploadModal } from './upload/CsvUploadModal';
import { 
  validateCSVFile, 
  generateTableNameFromFile, 
  formatNumber, 
  formatTimeAgo,
  showErrorWithRetry,
  showSuccessWithAction,
  createLoadingToast,
  updateLoadingToast,
  withOptimisticUpdate
} from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { CSVUploadProgress } from '@/types/bulkDownload';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import AdvancedTablesView from '@/components/dashboard/AdvancedTablesView';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// TableData interface as specified in PRD
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

// Upload progress interface for tracking file uploads
interface UploadProgress {
  fileName: string;
  progress: number;
  stage: "upload" | "parse" | "create" | "import";
  status: "uploading" | "success" | "error";
  jobId?: string;
  error?: string;
}

type TableDashboardProps = {
  onRegisterUploadTrigger?: (trigger: (() => void) | null) => void;
  onSearch?: (value: string) => void;
};

export default function TableDashboard({
  onRegisterUploadTrigger,
  renderEmptyState,
  onSearchApollo,
  onConnectWebhook,
  onSearch,
}: TableDashboardProps & {
  renderEmptyState?: () => React.ReactNode;
  onSearchApollo?: () => void;
  onConnectWebhook?: () => void;
}) {
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PRD 3.3: Enhanced Search and Filtering Implementation
  // Features: debounced search, multi-field search, smart filter suggestions, 
  // clear indicators, URL persistence, and improved empty states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  // Modal visibility flag for CSV uploads - explicitly controlled, never auto-opens
  // Important: This must stay false on mount to prevent auto-opening
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ensure modal is closed on mount and track mount state
  useEffect(() => {
    setMounted(true);
    setShowUploadModal(false);
    return () => setMounted(false);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Enhanced search function for multi-field and multi-word search
  const getSearchableText = useCallback((table: TableData): string => {
    return [
      table.name,
      table.description || '',
      table.source,
      table.status,
      table.rows.toString(),
      table.columns.toString()
    ].join(' ').toLowerCase();
  }, []);

  useEffect(() => {
    onSearch?.(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  // Enhanced filter logic with advanced search capabilities
  const filteredTables = tables.filter(table => {
    // Advanced search with multi-word support
    const searchableText = getSearchableText(table);
    const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    
    const matchesSearch = searchTerms.length === 0 || 
      searchTerms.every(term => searchableText.includes(term));
    
    // Source and status filtering
    const matchesSource = sourceFilter === 'all' || table.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;

    return matchesSearch && matchesSource && matchesStatus;
  });

  // Filter state management
  const hasActiveFilters = sourceFilter !== 'all' || statusFilter !== 'all' || searchQuery.length > 0;

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSourceFilter('all');
    setStatusFilter('all');
  }, []);

  // Smart filter suggestions with counts
  const getFilterSuggestions = useCallback(() => {
    const sources = Array.from(new Set(tables.map(table => table.source)));
    const statuses = Array.from(new Set(tables.map(table => table.status)));
    
    return {
      sources: sources.map(source => ({
        value: source,
        label: source,
        count: tables.filter(table => table.source === source).length
      })),
      statuses: statuses.map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: tables.filter(table => table.status === status).length
      }))
    };
  }, [tables]);

  // Empty state handling with delay to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEmptyMessage(filteredTables.length === 0 && hasActiveFilters);
    }, 150);

    return () => clearTimeout(timer);
  }, [filteredTables.length, hasActiveFilters]);

  // URL state persistence - Load filters from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlSource = searchParams.get('source') || 'all';
    const urlStatus = searchParams.get('status') || 'all';
    
    setSearchQuery(urlSearch);
    setSourceFilter(urlSource);
    setStatusFilter(urlStatus);
  }, [searchParams]);

  // Bulk selection hook - updated to use filtered tables
  const bulkSelection = useBulkSelection({
    allItemIds: filteredTables.map(table => table.id),
    onSelectionChange: useCallback((selectedIds: Set<string>) => {
      // Optional: Handle selection changes
    }, [])
  });

  // Clear bulk selection when filters change to maintain consistency
  useEffect(() => {
    if (bulkSelection.selectedCount > 0) {
      bulkSelection.clearSelection();
    }
  }, [debouncedSearchQuery, sourceFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket progress tracking for CSV uploads
  const handleCSVUploadProgress = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    setUploadProgress(prev => prev ? {
      ...prev,
      progress: progress.progress.percentage,
      stage: mapBackendStageToFrontend(progress.status),
      currentStep: progress.progress.currentStep
    } : null);
  };

  const handleCSVUploadComplete = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    // Update table in list with final data
    if (progress.tableId && progress.tableName) {
      const newTable: TableData = {
        id: progress.tableId,
        name: progress.tableName,
        rows: progress.progress.totalRows || 0,
        columns: 0, // Will be updated when table data loads
        source: "CSV",
        lastModified: new Date(),
        status: "ready",
        description: "Recently uploaded CSV file",
      };

      setTables((prev) => [newTable, ...prev]);
    }

    setUploadProgress(prev => prev ? { 
      ...prev, 
      progress: 100, 
      status: 'success',
      tableId: progress.tableId 
    } : null);
    
    toast.success('Table created successfully!');
    setTimeout(() => setUploadProgress(null), 1500);
  };

  const handleCSVUploadFailed = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    setUploadProgress(prev => prev ? { 
      ...prev, 
      status: 'error',
      error: progress.error || 'Upload failed'
    } : null);
    
    toast.error(progress.error || 'Upload failed');
    setTimeout(() => setUploadProgress(null), 3000);
  };

  // Initialize WebSocket connection
  const { isConnected } = useWebSocket({
    userId: user?.id,
    onCSVUploadProgress: handleCSVUploadProgress,
    onCSVUploadComplete: handleCSVUploadComplete,
    onCSVUploadFailed: handleCSVUploadFailed,
  });

  // Map backend progress stages to frontend stages
  const mapBackendStageToFrontend = (backendStage: string): UploadProgress['stage'] => {
    const stageMap: Record<string, UploadProgress['stage']> = {
      'uploading': 'upload',
      'parsing': 'parse', 
      'creating_table': 'create',
      'importing_data': 'import'
    };
    return stageMap[backendStage] || 'upload';
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
        await fetchTables();
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchTables = async () => {
    try {
      const response = await apiClient.tables.list();
      if (response.data.success) {
        // Transform UserTable to TableData format
        const transformedTables: TableData[] = response.data.data.map((table: UserTable) => ({
          id: table.id,
          name: table.name,
          rows: table._count?.rows || table.totalRows || 0,
          columns: table._count?.columns || table.columns?.length || 0,
          source: (table.sourceType === 'apollo' ? 'Apollo' : 
                   table.sourceType === 'csv' ? 'CSV' : 'Manual') as "CSV" | "Apollo" | "Manual",
          lastModified: new Date(table.updatedAt),
          status: 'ready' as const, // Default status, could be enhanced based on table processing state
          description: table.description,
        }));
        
        // Sort by lastModified descending as required
        transformedTables.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        setTables(transformedTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      showErrorWithRetry(error, {
        operation: 'load tables',
        retry: fetchTables
      });
    }
  };

  // Enhanced action handlers with proper functionality
  const handleViewTable = useCallback((tableId: string) => {
    router.push(`/dashboard/tables/${tableId}`);
  }, [router]);

  const handleEditTable = useCallback((tableId: string) => {
    router.push(`/dashboard/tables/${tableId}/edit`);
  }, [router]);

  const handleExportTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      toast.loading(`Preparing export for ${table.name}...`, { id: 'export' });
      
      // TODO: Replace with actual export API when available
      // const response = await apiClient.tables.export(tableId);
      
      // Simulate export process for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${table.name} export completed!`, { id: 'export' });
      // In the future, this would trigger a download or show export modal
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export ${table.name}`, { id: 'export' });
    }
  }, [tables]);

  const handleDuplicateTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      toast.loading(`Duplicating ${table.name}...`, { id: 'duplicate' });
      
      // TODO: Replace with actual duplicate API when available
      // const response = await apiClient.tables.duplicate(tableId);
      
      // Simulate duplication process for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock duplicated table for demonstration
      const duplicatedTable: TableData = {
        ...table,
        id: `${table.id}_copy_${Date.now()}`,
        name: `${table.name} (Copy)`,
        lastModified: new Date(),
        description: `Copy of ${table.name}`,
      };
      
      setTables(prev => [duplicatedTable, ...prev]);
      toast.success(`${table.name} duplicated successfully!`, { id: 'duplicate' });
    } catch (error) {
      console.error('Duplication failed:', error);
      toast.error(`Failed to duplicate ${table.name}`, { id: 'duplicate' });
    }
  }, [tables]);

  const handleDeleteTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (!confirm(`Are you sure you want to delete "${table.name}"? This action cannot be undone.`)) {
      return;
    }
    
    const toastId = createLoadingToast(`Deleting ${table.name}...`);
    
    try {
      await withOptimisticUpdate(
        // Optimistic update: remove table immediately
        () => setTables(prev => prev.filter(t => t.id !== tableId)),
        // API call
        () => apiClient.tables.delete(tableId),
        // Revert update: add table back
        () => setTables(prev => {
          const newTables = [...prev, table];
          newTables.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
          return newTables;
        }),
        // Error context
        {
          operation: 'delete table',
          entityType: 'table',
          entityName: table.name,
          retry: () => handleDeleteTable(tableId)
        }
      );
      
      updateLoadingToast(toastId, 'success', `${table.name} deleted successfully`);
    } catch (error) {
      console.error('Delete failed:', error);
      updateLoadingToast(toastId, 'error', `Failed to delete ${table.name}`);
    }
  }, [tables]);

  const handleTableAction = useCallback(async (action: string, tableId: string) => {
    switch (action) {
      case 'view':
        handleViewTable(tableId);
        break;
      case 'edit':
        handleEditTable(tableId);
        break;
      case 'export':
        await handleExportTable(tableId);
        break;
      case 'duplicate':
        await handleDuplicateTable(tableId);
        break;
      case 'delete':
        await handleDeleteTable(tableId);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }, [handleViewTable, handleEditTable, handleExportTable, handleDuplicateTable, handleDeleteTable]);

  // Bulk action handlers
  const handleBulkExport = useCallback(async () => {
    const selectedIds = bulkSelection.selectedIdsArray;
    const selectedTables = tables.filter(table => selectedIds.includes(table.id));
    
    if (selectedIds.length === 0) return;
    
    try {
      toast.loading(`Preparing export for ${selectedIds.length} tables...`, { id: 'bulk-export' });
      
      // TODO: Replace with actual bulk export API when available
      // const response = await apiClient.tables.bulkExport(selectedIds);
      
      // Simulate export process for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In the future, this would trigger a ZIP download
      const tableNames = selectedTables.map(t => t.name).join(', ');
      toast.success(`Exported ${selectedIds.length} tables: ${tableNames}`, { id: 'bulk-export' });
      
      // Clear selection after successful export
      bulkSelection.clearSelection();
    } catch (error) {
      console.error('Bulk export failed:', error);
      toast.error(`Failed to export ${selectedIds.length} tables`, { id: 'bulk-export' });
    }
  }, [bulkSelection, tables]);

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = bulkSelection.selectedIdsArray;
    const selectedTables = tables.filter(table => selectedIds.includes(table.id));
    
    if (selectedIds.length === 0) return;
    
    const tableNames = selectedTables.map(table => table.name);
    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} table${selectedIds.length > 1 ? 's' : ''}?\n\n${tableNames.join('\n')}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;
    
    const bulkDeleteToastId = createLoadingToast(`Deleting ${selectedIds.length} tables...`);
    
    try {
      await withOptimisticUpdate(
        // Optimistic update: remove selected tables immediately
        () => setTables(prev => prev.filter(table => !selectedIds.includes(table.id))),
        // API call: delete tables individually (bulk API not yet available)
        async () => {
          const deletePromises = selectedIds.map(id => apiClient.tables.delete(id));
          return await Promise.all(deletePromises);
        },
        // Revert update: add tables back
        () => setTables(prev => {
          const restoredTables = [...prev, ...selectedTables];
          restoredTables.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
          return restoredTables;
        }),
        // Error context
        {
          operation: 'delete tables',
          entityType: 'tables',
          retry: handleBulkDelete
        }
      );
      
      // Clear selection on success
      bulkSelection.clearSelection();
      
      updateLoadingToast(
        bulkDeleteToastId, 
        'success', 
        `Successfully deleted ${selectedIds.length} table${selectedIds.length > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Bulk delete failed:', error);
      updateLoadingToast(bulkDeleteToastId, 'error', `Failed to delete some tables`);
    }
  }, [bulkSelection, tables]);

  // Keyboard shortcuts for bulk actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when bulk selection is active and has selections
      if (!bulkSelection.showBulkActions || bulkSelection.selectedCount === 0) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault();
            bulkSelection.selectAll();
            break;
          case 'e':
            e.preventDefault();
            handleBulkExport();
            break;
          case 'backspace':
          case 'delete':
            e.preventDefault();
            handleBulkDelete();
            break;
        }
      }
      
      if (e.key === 'Escape') {
        bulkSelection.clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bulkSelection, handleBulkExport, handleBulkDelete]);

  // PRD 4.3: Enhanced file upload with comprehensive error handling
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Enhanced file validation with user-friendly messages
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      showErrorWithRetry(new Error(validation.error!), {
        operation: 'upload file',
        retry: () => {
          // Trigger file dialog for retry
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              handleFileUpload(Array.from(files));
            }
          };
          input.click();
        }
      });
      return;
    }

    // Generate table name from filename
    const tableName = generateTableNameFromFile(file.name);

    // Initialize upload progress
    const progress: UploadProgress = {
      fileName: file.name,
      progress: 0,
      stage: "upload",
      status: "uploading",
    };

    setShowUploadModal(false);
    setUploadProgress(progress);
    const uploadToastId = createLoadingToast(`Uploading ${file.name}...`);

    try {
      // Start upload with progress tracking
      setUploadProgress(prev => prev ? { ...prev, progress: 10, stage: "upload" } : null);
      
      const response = await apiClient.tables.uploadCSV(file, tableName);
      
      if (response.data.success) {
        // Upload complete, backend processing begins
        setUploadProgress(prev => prev ? { 
          ...prev, 
          progress: 30, 
          stage: "parse",
          jobId: response.data.data.jobId 
        } : null);
        
        updateLoadingToast(uploadToastId, 'success', 'CSV uploaded successfully! Processing...');
        
        // Real WebSocket progress tracking begins here
        // The WebSocket callbacks will handle further progress updates
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => prev ? { 
        ...prev, 
        status: "error",
        error: error.message 
      } : null);
      
      showErrorWithRetry(error, {
        operation: 'upload CSV file',
        entityType: 'file',
        entityName: file.name,
        retry: () => handleFileUpload([file])
      });
      
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  // PRD 4.3: Enhanced loading states with skeleton
  const TableSkeleton = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Compact Drop Zone Skeleton */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-8 w-24 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full md:w-[180px]" />
        <Skeleton className="h-10 w-full md:w-[180px]" />
        <Skeleton className="h-10 w-full sm:w-auto" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="hidden md:table-cell text-right"><Skeleton className="h-4 w-12" /></TableHead>
                <TableHead className="hidden lg:table-cell text-right"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead className="w-[50px]"><Skeleton className="h-4 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden lg:table-cell text-right"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <Skeleton className="h-4 w-48" />
    </div>
  );

  useEffect(() => {
    if (!onRegisterUploadTrigger || !mounted) return;

    const trigger = () => {
      // Only open if component is mounted and not already showing
      if (mounted && !showUploadModal) {
        setShowUploadModal(true);
      }
    };

    onRegisterUploadTrigger(trigger);

    return () => {
      onRegisterUploadTrigger(null);
    };
  }, [onRegisterUploadTrigger, mounted, showUploadModal]);

  // Provide default empty-state action for CSV uploads when parent doesn't override it.
  const triggerImportCSV = useCallback(() => {
    console.info('[TableDashboard] triggerImportCSV invoked, mounted:', mounted);
    // Only open modal if component is fully mounted
    if (mounted) {
      setShowUploadModal(true);
    }
  }, [mounted]);

  // Delegate Apollo searches to parent when available, otherwise show a helpful placeholder toast.
  const triggerSearchApollo = useCallback(() => {
    console.info('[TableDashboard] triggerSearchApollo invoked');
    if (onSearchApollo) {
      onSearchApollo();
      return;
    }
    toast('Apollo.io search will be available soon.');
  }, [onSearchApollo]);

  // Delegate webhook connections to parent or fall back to a coming-soon notification.
  const triggerConnectWebhook = useCallback(() => {
    console.info('[TableDashboard] triggerConnectWebhook invoked');
    if (onConnectWebhook) {
      onConnectWebhook();
      return;
    }
    toast('Webhook integrations are coming soon.');
  }, [onConnectWebhook]);

  if (loading) {
    return (
      <FileUploadDropzone onFileUpload={handleFileUpload}>
        <div className="space-y-6">
          <TableSkeleton />
        </div>
      </FileUploadDropzone>
    );
  }

  // PRD 4.1: Render dashboard content based on table state
  const renderDashboardContent = () => {
    if (tables.length === 0) {
      return (
        <div className="min-h-[60vh]">
          {renderEmptyState
            ? renderEmptyState()
            : (
              <EmptyState
                onImportCSV={triggerImportCSV}
                onSearchApollo={triggerSearchApollo}
                onConnectWebhook={triggerConnectWebhook}
              />
            )}
        </div>
      );
    }

    return (
      <AdvancedTablesView
        tables={filteredTables.map((table) => ({
          id: table.id,
          name: table.name,
          rows: table.rows,
          columns: table.columns,
          source: table.source,
          lastModified: table.lastModified,
          status: table.status,
          description: table.description,
          owner: user?.email ?? 'Unknown',
        }))}
        onImportCSV={triggerImportCSV}
        onSearchApollo={triggerSearchApollo}
        onViewTable={(id) => handleTableAction('view', id)}
        onEditTable={(id) => handleTableAction('edit', id)}
        onDuplicateTable={(id) => handleTableAction('duplicate', id)}
        onDeleteTable={(id) => handleTableAction('delete', id)}
      />
    );
  };

  // PRD 4.1: Wrap entire dashboard with FileUploadDropzone for global drag-and-drop
  return (
    <>
      <CsvUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadFiles={handleFileUpload}
      />
      <FileUploadDropzone onFileUpload={handleFileUpload}>
        {renderDashboardContent()}
      </FileUploadDropzone>
    </>
  );
}
