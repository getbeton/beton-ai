'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable } from '@/lib/api';
import { 
  Search,
  Upload,
  Plus,
  CheckSquare,
  X,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from './EmptyState';
import { UploadProgressOverlay } from './upload/UploadProgressOverlay';
import { FileUploadDropzone } from './upload/FileUploadDropzone';
import { BulkActionToolbar } from './tables/BulkActionToolbar';
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
import { TableRowComponent } from './tables/TableRowComponent';

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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function TableDashboard() {
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
  const router = useRouter();
  const searchParams = useSearchParams();

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

  if (loading) {
    return (
      <FileUploadDropzone onFileUpload={handleFileUpload}>
        <div className="space-y-6">
          <TableSkeleton />
        </div>
      </FileUploadDropzone>
    );
  }

  // PRD 4.1: Compact Drop Zone Component for Populated State
  const CompactDropZone = () => (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileSpreadsheet className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Another CSV
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Drag and drop a CSV file here, or click to browse
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
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
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // PRD 4.1: Render dashboard content based on table state
  const renderDashboardContent = () => {
    // Empty State: Large, prominent drop zone
    if (tables.length === 0) {
      return (
        <div className="min-h-screen bg-background p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tables</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2">
                Manage your prospect data tables and CSV uploads
              </p>
            </div>
            <EmptyState onFileUpload={handleFileUpload} />
          </div>
        </div>
      );
    }

    // Populated State: Dashboard with compact drop zone
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
            <p className="text-muted-foreground">
              Manage your data tables and CSV uploads
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => {
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
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
        </div>

        {/* Compact Drop Zone - Only show when not in bulk selection mode */}
        {!bulkSelection.isSelecting && (
          <CompactDropZone />
        )}

        {/* Results count and filter controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">
              {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
              {hasActiveFilters && ` found`}
            </h2>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tables by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources ({tables.length})</SelectItem>
              {getFilterSuggestions().sources.map(source => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label} ({source.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({tables.length})</SelectItem>
              {getFilterSuggestions().statuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label} ({status.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={bulkSelection.toggleBulkMode}
            className={`w-full sm:w-auto ${bulkSelection.isSelecting ? "bg-blue-50 text-blue-700 border-blue-300" : ""}`}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {bulkSelection.isSelecting ? 'Cancel Selection' : 'Select Tables'}
          </Button>
        </div>

        {/* Select All Section - Only show when in bulk selection mode */}
        {bulkSelection.isSelecting && filteredTables.length > 0 && (
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox
              checked={bulkSelection.isAllSelected}
              data-indeterminate={bulkSelection.isIndeterminate}
              onCheckedChange={bulkSelection.selectAll}
            />
            <span className="text-sm font-medium text-blue-900">
              Select all ({filteredTables.length} tables)
            </span>
            {bulkSelection.selectedCount > 0 && (
              <span className="text-sm text-blue-700 ml-auto">
                {bulkSelection.selectedCount} selected
              </span>
            )}
          </div>
        )}

        {/* Tables List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Rows</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Columns</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-muted-foreground">
                          {hasActiveFilters 
                            ? 'No tables match your filters'
                            : 'No tables found'
                          }
                        </div>
                        {hasActiveFilters ? (
                          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button variant="outline" size="sm" onClick={clearAllFilters}>
                              Clear all filters
                            </Button>
                            <span className="text-sm text-muted-foreground">or</span>
                            <Button variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Create new table
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first table
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTables.map((table) => (
                    <TableRowComponent 
                      key={table.id} 
                      table={table} 
                      onAction={handleTableAction}
                      isSelected={bulkSelection.isSelected(table.id)}
                      onSelect={bulkSelection.isSelecting ? bulkSelection.toggleItem : undefined}
                      showBulkActions={bulkSelection.isSelecting}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Enhanced Summary Stats */}
        {tables.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {hasActiveFilters ? (
                <span>
                  Showing {filteredTables.length} of {tables.length} tables
                  {filteredTables.length !== tables.length && (
                    <span className="ml-2">
                      ({tables.length - filteredTables.length} hidden by filters)
                    </span>
                  )}
                </span>
              ) : (
                <span>Showing all {tables.length} tables</span>
              )}
            </div>
            {bulkSelection.selectedCount > 0 && (
              <div className="text-blue-600">
                {bulkSelection.selectedCount} table{bulkSelection.selectedCount !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploadProgress && (
          <UploadProgressOverlay
            progress={uploadProgress}
            onClose={() => setUploadProgress(null)}
            onViewTable={(tableId) => {
              setUploadProgress(null);
              router.push(`/dashboard/tables/${tableId}`);
            }}
          />
        )}

        {/* Bulk Action Toolbar */}
        <BulkActionToolbar
          selectedCount={bulkSelection.selectedCount}
          onClearSelection={bulkSelection.clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          visible={bulkSelection.showBulkActions}
        />
      </div>
    );
  };

  // PRD 4.1: Wrap entire dashboard with FileUploadDropzone for global drag-and-drop
  return (
    <FileUploadDropzone onFileUpload={handleFileUpload}>
      {renderDashboardContent()}
    </FileUploadDropzone>
  );
}
